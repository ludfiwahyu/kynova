import { randomUUID } from 'node:crypto'

import { db, type Queryable } from '#server/database/index.ts'
import type {
    ArchiveEntry,
    ChangeMessage,
    ClientChange,
    Comment,
    DeleteMessage,
    Entity,
    EntityMap,
    HttpItem,
    HttpRequest,
    Item,
    PatchRequestMessage,
    PutMessage,
    RequestVersion,
    Role,
    SaveRequestMessage,
    Snapshot,
    User,
    WebSocketItem,
} from '#shared/types.ts'
import { MAX_VERSIONS } from '#shared/types.ts'

import { isEntity, isId, isValidEnvironment, isValidItem, isValidSettings } from './validation.ts'
import { hasRole } from './workspaces.ts'

/** A change the server refused. The message is shown to the user who sent it. */
export class ChangeRejected extends Error {}

const MAX_COMMENT_LENGTH = 5000

// ── Storage ──────────────────────────────────────────────────────────────

/** Saved request versions live in the docs table under their own entity, which is never synced. */
const VERSIONS = 'versions'

type StoredEntity = Entity | typeof VERSIONS

/** Reads and writes one workspace's documents, through `query` (the database or a transaction). */
function workspaceDocs(query: Queryable, workspaceId: string) {
    return {
        async list<E extends Entity>(entity: E): Promise<EntityMap[E][]> {
            const rows = await query.all<{ data: string }>(
                'SELECT data FROM docs WHERE workspace_id = ? AND entity = ?',
                [workspaceId, entity],
            )

            return rows.map((row) => JSON.parse(row.data))
        },

        async get<E extends Entity>(entity: E, id: string): Promise<EntityMap[E] | null> {
            const row = await query.get<{ data: string }>(
                'SELECT data FROM docs WHERE workspace_id = ? AND entity = ? AND id = ?',
                [workspaceId, entity, id],
            )

            return row ? JSON.parse(row.data) : null
        },

        /** A request's saved versions, newest first. Stored beside the documents, never synced. */
        async versions(itemId: string): Promise<RequestVersion[]> {
            const rows = await query.all<{ data: string }>(
                `SELECT data FROM docs WHERE workspace_id = ? AND entity = ? AND id LIKE ? ESCAPE '!'`,
                [workspaceId, VERSIONS, `${itemId.replace(/[!%_]/g, '!$&')}:%`],
            )

            return rows
                .map((row) => JSON.parse(row.data) as RequestVersion)
                .sort((a, b) => b.savedAt - a.savedAt)
        },

        async save(entity: StoredEntity, doc: { id: string }): Promise<void> {
            await query.run(
                `INSERT INTO docs (workspace_id, entity, id, data) VALUES (?, ?, ?, ?)
         ON CONFLICT (workspace_id, entity, id) DO UPDATE SET data = excluded.data`,
                [workspaceId, entity, doc.id, JSON.stringify(doc)],
            )
        },

        async remove(entity: StoredEntity, id: string): Promise<void> {
            await query.run('DELETE FROM docs WHERE workspace_id = ? AND entity = ? AND id = ?', [
                workspaceId,
                entity,
                id,
            ])
        },
    }
}

type Docs = ReturnType<typeof workspaceDocs>

/** One stored document, or null when it is gone. */
export function loadDoc<E extends Entity>(
    workspaceId: string,
    entity: E,
    id: string,
): Promise<EntityMap[E] | null> {
    return workspaceDocs(db, workspaceId).get(entity, id)
}

/** A request's saved versions, newest first. */
export function loadVersions(workspaceId: string, itemId: string): Promise<RequestVersion[]> {
    return workspaceDocs(db, workspaceId).versions(itemId)
}

export async function loadSnapshot(workspaceId: string): Promise<Snapshot> {
    const docs = workspaceDocs(db, workspaceId)

    return {
        items: await docs.list('items'),
        environments: await docs.list('environments'),
        comments: await docs.list('comments'),
        settings: await docs.list('settings'),
        archive: await docs.list('archive'),
    }
}

// ── Tree checks ──────────────────────────────────────────────────────────

const isContainer = (item: Item | null | undefined) =>
    item?.kind === 'collection' || item?.kind === 'folder'

/**
 * An item must sit in a collection or folder of this workspace, never inside
 * itself, and keep its kind: turning a folder into a request would strand its children.
 */
async function assertPlacement(docs: Docs, item: Item): Promise<void> {
    const stored = await docs.get('items', item.id)
    const isRequestKind = (kind: Item['kind']) => kind === 'http' || kind === 'websocket'

    // A request may switch between HTTP and WebSocket; nothing else changes kind, since a folder holds children.
    if (
        stored &&
        stored.kind !== item.kind &&
        !(isRequestKind(stored.kind) && isRequestKind(item.kind))
    ) {
        throw new ChangeRejected('An item cannot change its kind.')
    }

    if (item.parentId === null || stored?.parentId === item.parentId) {
        return
    }

    const items = new Map((await docs.list('items')).map((existing) => [existing.id, existing]))

    if (!isContainer(items.get(item.parentId))) {
        throw new ChangeRejected('Items can only go in a collection or folder.')
    }

    for (
        let ancestor = items.get(item.parentId);
        ancestor;
        ancestor = items.get(ancestor.parentId ?? '')
    ) {
        if (ancestor.id === item.id) {
            throw new ChangeRejected('An item cannot be placed inside itself.')
        }
    }
}

// ── Changes ──────────────────────────────────────────────────────────────

function requireEditor(role: Role): void {
    if (!hasRole(role, 'editor')) {
        throw new ChangeRejected('Viewers cannot edit this workspace.')
    }
}

function requireOwner(role: Role): void {
    if (role !== 'owner') {
        throw new ChangeRejected('Only the workspace owner can change workspace settings.')
    }
}

/** Comments are created, never edited, and the server decides who wrote them and when. */
async function createComment(docs: Docs, author: User, doc: unknown): Promise<Comment> {
    const { id, itemId, text } = (doc ?? {}) as Partial<Comment>

    if (!isId(id) || !isId(itemId) || typeof text !== 'string') {
        throw new ChangeRejected('That comment is not valid.')
    }

    const item = await docs.get('items', itemId)

    if (!item || isContainer(item)) {
        throw new ChangeRejected('Comments can only be left on a request that exists.')
    }

    const trimmed = text.trim()

    if (!trimmed || trimmed.length > MAX_COMMENT_LENGTH) {
        throw new ChangeRejected('Comments need 1 to 5000 characters.')
    }

    if (await docs.get('comments', id)) {
        throw new ChangeRejected('Comments cannot be edited.')
    }

    return {
        id,
        itemId,
        userId: author.id,
        authorName: author.name,
        text: trimmed,
        createdAt: Date.now(),
    }
}

async function applyPut(
    docs: Docs,
    user: User,
    role: Role,
    change: PutMessage,
): Promise<ChangeMessage> {
    if (change.entity === 'comments') {
        const comment = await createComment(docs, user, change.doc)

        await docs.save('comments', comment)

        return {
            type: 'put',
            entity: 'comments',
            doc: comment,
        }
    }

    if (change.entity === 'archive') {
        throw new ChangeRejected('The Archive is filled by deleting, not written to.')
    }

    if (change.entity === 'settings') {
        requireOwner(role)

        if (!isValidSettings(change.doc)) {
            throw new ChangeRejected('Those workspace settings are not valid.')
        }

        await docs.save('settings', change.doc)

        return {
            type: 'put',
            entity: 'settings',
            doc: change.doc,
        }
    }

    requireEditor(role)

    if (change.entity === 'items') {
        if (!isValidItem(change.doc)) {
            throw new ChangeRejected('That change is not valid.')
        }

        await assertPlacement(docs, change.doc)

        // Who saved it last is the server's to say: a rename or move keeps the stored stamp.
        const stored = await docs.get('items', change.doc.id)
        const { savedBy: _savedBy, savedAt: _savedAt, ...rest } = change.doc

        change = {
            ...change,
            doc: {
                ...rest,
                ...(stored?.savedBy === undefined ? {} : { savedBy: stored.savedBy }),
                ...(stored?.savedAt === undefined ? {} : { savedAt: stored.savedAt }),
            } as Item,
        }
    } else if (!isValidEnvironment(change.doc)) {
        throw new ChangeRejected('That change is not valid.')
    }

    await docs.save(change.entity, change.doc)

    return {
        type: 'put',
        entity: change.entity,
        doc: change.doc,
    } as ChangeMessage
}

const REQUEST_FIELDS: (keyof HttpRequest)[] = [
    'method',
    'url',
    'params',
    'headers',
    'auth',
    'body',
    'pathVariables',
]

/** Merges changed request fields into the stored request, and returns the merged item. */
async function applyPatch(
    docs: Docs,
    role: Role,
    change: PatchRequestMessage,
): Promise<ChangeMessage> {
    requireEditor(role)
    const item = await docs.get('items', change.id)
    const changes = change.changes as Record<string, unknown> | null

    if (item?.kind !== 'http' || typeof changes !== 'object' || changes === null) {
        throw new ChangeRejected('That request no longer exists.')
    }

    const request = { ...item.request }

    for (const field of REQUEST_FIELDS) {
        if (field in changes) {
            Object.assign(request, { [field]: changes[field] })
        }
    }

    const merged = {
        ...item,
        request,
    }

    if (!isValidItem(merged)) {
        throw new ChangeRejected('That change is not valid.')
    }

    await docs.save('items', merged)

    return {
        type: 'put',
        entity: 'items',
        doc: merged,
    }
}

/**
 * Saves a request's draft over the stored request. The content (request or URL, and scripts)
 * comes from the draft; the name, place, docs and tag stay as stored, so a rename or move made
 * meanwhile is kept. The server stamps who saved it and when.
 */
async function applySave(
    docs: Docs,
    user: User,
    role: Role,
    change: SaveRequestMessage,
): Promise<ChangeMessage> {
    requireEditor(role)

    const draft = change.doc as Item | null
    const stored = draft && isId(draft.id) ? await docs.get('items', draft.id) : null

    if (!stored || (stored.kind !== 'http' && stored.kind !== 'websocket')) {
        throw new ChangeRejected('That request no longer exists.')
    }

    if (draft!.kind !== stored.kind) {
        throw new ChangeRejected('This request changed type meanwhile. Reload it to save.')
    }

    const content =
        draft!.kind === 'http'
            ? { request: (draft as HttpItem).request }
            : { url: (draft as WebSocketItem).url }
    const { scripts: _scripts, ...base } = stored
    const saved = {
        ...base,
        ...content,
        ...(draft!.scripts === undefined ? {} : { scripts: draft!.scripts }),
        savedBy: user.name,
        // Always later than the save it replaces, so versions keep their order within a millisecond.
        savedAt: Math.max(Date.now(), (stored.savedAt ?? 0) + 1),
    } as Item

    if (!isValidItem(saved)) {
        throw new ChangeRejected('That change is not valid.')
    }

    await docs.save('items', saved)
    await recordVersion(docs, stored, saved as HttpItem | WebSocketItem)

    return {
        type: 'put',
        entity: 'items',
        doc: saved,
    }
}

function versionOf(
    item: HttpItem | WebSocketItem,
    savedBy: string,
    savedAt: number,
): RequestVersion {
    return {
        id: `${item.id}:${savedAt}:${randomUUID().slice(0, 8)}`,
        itemId: item.id,
        kind: item.kind,
        savedBy,
        savedAt,
        ...(item.kind === 'http' ? { request: item.request } : { url: item.url }),
        ...(item.scripts === undefined ? {} : { scripts: item.scripts }),
    }
}

/**
 * Keeps the new save as a version. The first save also keeps what it replaced, so the version
 * that lost is never gone. Only the last MAX_VERSIONS stay.
 */
async function recordVersion(
    docs: Docs,
    before: HttpItem | WebSocketItem,
    saved: HttpItem | WebSocketItem,
): Promise<void> {
    if ((await docs.versions(saved.id)).length === 0) {
        const beforeAt = Math.min(before.savedAt ?? saved.savedAt! - 1, saved.savedAt! - 1)

        await docs.save(VERSIONS, versionOf(before, before.savedBy ?? 'Before history', beforeAt))
    }

    await docs.save(VERSIONS, versionOf(saved, saved.savedBy!, saved.savedAt!))

    for (const old of (await docs.versions(saved.id)).slice(MAX_VERSIONS)) {
        await docs.remove(VERSIONS, old.id)
    }
}

/** Ids of every item nested under `rootId`, at any depth. */
function descendantIds(items: Item[], rootId: string): string[] {
    const children = items.filter((item) => item.parentId === rootId)

    return children.flatMap((child) => [child.id, ...descendantIds(items, child.id)])
}

/** The collection an item sits in: the item itself for a collection. */
function collectionOf(items: Map<string, Item>, item: Item): Item | undefined {
    let current: Item | undefined = item

    while (current?.parentId) {
        current = items.get(current.parentId)
    }

    return current
}

/**
 * Deleting an item moves it to the Archive, with what it contains and the comments on all of
 * it, as one entry that remembers who deleted it and when. Its documents leave the tree.
 */
async function archiveItem(
    docs: Docs,
    user: User,
    change: DeleteMessage,
): Promise<ChangeMessage[]> {
    const all = await docs.list('items')
    const byId = new Map(all.map((item) => [item.id, item]))
    const root = byId.get(change.id)

    if (!root) {
        return []
    }

    const nested = descendantIds(all, change.id)
    const removedItemIds = new Set([change.id, ...nested])
    const comments = (await docs.list('comments')).filter((comment) =>
        removedItemIds.has(comment.itemId),
    )
    const collection = collectionOf(byId, root)

    const entry: ArchiveEntry = {
        id: `archive-${randomUUID()}`,
        itemId: root.id,
        name: root.name,
        kind: root.kind,
        parentId: root.parentId,
        collectionId: collection && collection.id !== root.id ? collection.id : null,
        deletedBy: user.name,
        deletedAt: Date.now(),
        items: [root, ...nested.map((id) => byId.get(id)!)],
        comments,
    }

    const removed: DeleteMessage[] = [
        ...[...removedItemIds].map(
            (id) =>
                ({
                    type: 'delete',
                    entity: 'items',
                    id,
                }) as const,
        ),
        ...comments.map(
            ({ id }) =>
                ({
                    type: 'delete',
                    entity: 'comments',
                    id,
                }) as const,
        ),
    ]

    for (const { entity, id } of removed) {
        await docs.remove(entity, id)
    }

    await docs.save('archive', entry)

    return [
        ...removed,
        {
            type: 'put',
            entity: 'archive',
            doc: entry,
        },
    ]
}

/** Deleting from the Archive is for good: the entry goes, and the saved versions of its requests. */
async function deleteArchived(docs: Docs, id: string): Promise<ChangeMessage[]> {
    const entry = await docs.get('archive', id)

    for (const item of entry?.items ?? []) {
        for (const version of await docs.versions(item.id)) {
            await docs.remove(VERSIONS, version.id)
        }
    }

    await docs.remove('archive', id)

    return [
        {
            type: 'delete',
            entity: 'archive',
            id,
        },
    ]
}

/**
 * Puts an archived item back with what it contained and their comments: in its old place, or
 * its collection when that place is gone. Refused when its collection is gone too.
 */
async function restoreArchived(docs: Docs, role: Role, id: string): Promise<ChangeMessage[]> {
    requireEditor(role)

    const entry = await docs.get('archive', id)

    if (!entry) {
        throw new ChangeRejected('That item is no longer in the Archive.')
    }

    const [root, ...inside] = entry.items
    const existing = new Map((await docs.list('items')).map((item) => [item.id, item]))

    if (entry.items.some((item) => existing.has(item.id))) {
        throw new ChangeRejected('That item is already back in the workspace.')
    }

    let parentId = root.parentId

    if (parentId !== null && !isContainer(existing.get(parentId))) {
        if (!entry.collectionId || !existing.has(entry.collectionId)) {
            throw new ChangeRejected(
                'Its collection is in the Archive too. Restore the collection first.',
            )
        }

        parentId = entry.collectionId
    }

    const siblings = [...existing.values()].filter((item) => item.parentId === parentId)
    const restoredRoot = {
        ...root,
        parentId,
        order: Math.max(0, ...siblings.map((item) => item.order + 1)),
    } as Item
    const restored = [restoredRoot, ...inside]

    for (const item of restored) {
        await docs.save('items', item)
    }

    for (const comment of entry.comments) {
        await docs.save('comments', comment)
    }

    await docs.remove('archive', id)

    return [
        ...restored.map(
            (item) =>
                ({
                    type: 'put',
                    entity: 'items',
                    doc: item,
                }) as ChangeMessage,
        ),
        ...entry.comments.map(
            (comment) =>
                ({
                    type: 'put',
                    entity: 'comments',
                    doc: comment,
                }) as ChangeMessage,
        ),
        {
            type: 'delete',
            entity: 'archive',
            id,
        },
    ]
}

async function applyDelete(
    docs: Docs,
    user: User,
    role: Role,
    change: DeleteMessage,
): Promise<ChangeMessage[]> {
    if (change.entity === 'comments') {
        const comment = await docs.get('comments', change.id)
        const mayDelete = comment?.userId === user.id || role === 'owner'

        if (comment && !mayDelete) {
            throw new ChangeRejected('You can only delete your own comments.')
        }
    } else if (change.entity === 'settings') {
        requireOwner(role)
    } else {
        requireEditor(role)
    }

    const removed: DeleteMessage = {
        type: 'delete',
        entity: change.entity,
        id: change.id,
    }

    if (change.entity === 'items') {
        return archiveItem(docs, user, removed)
    }

    if (change.entity === 'archive') {
        return deleteArchived(docs, change.id)
    }

    await docs.remove(change.entity, change.id)

    return [removed]
}

function isWellFormed(change: ClientChange): boolean {
    switch (change.type) {
        case 'put':
            return isEntity(change.entity)
        case 'delete':
            return isEntity(change.entity) && isId(change.id)
        case 'patch':
            return isId(change.id)
        case 'save':
            return typeof change.doc === 'object' && change.doc !== null
        case 'restore':
            return isId(change.id)
        default:
            return false
    }
}

/** Checks and stores a change, then returns the stored result: the changes everyone must apply. */
export async function applyChange(
    workspaceId: string,
    user: User,
    role: Role,
    change: ClientChange,
): Promise<ChangeMessage[]> {
    if (!isWellFormed(change)) {
        throw new ChangeRejected('That change is not valid.')
    }

    return db.transaction(async (tx) => {
        const docs = workspaceDocs(tx, workspaceId)

        switch (change.type) {
            case 'put':
                return [await applyPut(docs, user, role, change)]
            case 'patch':
                return [await applyPatch(docs, role, change)]
            case 'save':
                return [await applySave(docs, user, role, change)]
            case 'restore':
                return restoreArchived(docs, role, change.id)
            case 'delete':
                return applyDelete(docs, user, role, change)
        }
    })
}
