/** Edits to the open workspace. Each one applies locally and syncs to collaborators. */
import { newHttpRequest } from '@/constants'
import { useSession } from '@/stores/auth/session'
import { composeUrl, newId, nextOrder } from '@/utils'
import { MAX_NAME_LENGTH } from '#shared/limits.ts'
import type {
    Environment,
    HttpItem,
    HttpRequest,
    Item,
    WebSocketItem,
    WorkspaceSettings,
} from '#shared/types.ts'

import { discardDraft, editDraftRequest, useDrafts } from './drafts'
import { commit } from './sync'
import { useWorkspace } from './workspace'

const items = () => useWorkspace.getState().items

// ── Items ────────────────────────────────────────────────────────────────

/**
 * Stores an item for everyone. A request shown with a draft over it is stored with its saved
 * content, so renaming or moving it never saves the draft by the way.
 */
export function saveItem(item: Item): void {
    commit({
        type: 'put',
        entity: 'items',
        doc: withoutDraft(item),
    })
}

function withoutDraft(item: Item): Item {
    const saved = items()[item.id]
    const hasDraft = Boolean(useDrafts.getState().drafts[item.id])

    if (!hasDraft || !saved || saved.kind !== item.kind) {
        return item
    }

    if (saved.kind === 'http') {
        return {
            ...item,
            request: saved.request,
            scripts: saved.scripts,
        } as Item
    }

    if (saved.kind === 'websocket') {
        return {
            ...item,
            url: saved.url,
            scripts: saved.scripts,
        } as Item
    }

    return item
}

export function saveItems(list: Item[]): void {
    list.forEach(saveItem)
}

/** Puts an archived item back in the tree, for everyone. */
export function restoreArchived(id: string): void {
    commit({
        type: 'restore',
        id,
    })
}

/** Deletes an archived item for good. */
export function deleteArchived(id: string): void {
    commit({
        type: 'delete',
        entity: 'archive',
        id,
    })
}

/** Moves an item, with what it contains, to the Archive for everyone. */
export function deleteItem(id: string): void {
    commit({
        type: 'delete',
        entity: 'items',
        id,
    })
}

export function renameItem(item: Item, name: string): void {
    if (name.trim() && name !== item.name) {
        saveItem({
            ...item,
            name: name.trim(),
        })
    }
}

export function createCollection(name = 'New Collection'): Item {
    const collection: Item = {
        id: newId(),
        kind: 'collection',
        parentId: null,
        name,
        order: nextOrder(items(), null),
    }

    saveItem(collection)

    return collection
}

export function createFolder(parentId: string): Item {
    const folder: Item = {
        id: newId(),
        kind: 'folder',
        parentId,
        name: 'New Folder',
        order: nextOrder(items(), parentId),
    }

    saveItem(folder)

    return folder
}

export function createHttpRequest(parentId: string): HttpItem {
    const item: HttpItem = {
        id: newId(),
        kind: 'http',
        parentId,
        name: 'Untitled Request',
        order: nextOrder(items(), parentId),
        request: newHttpRequest(),
    }

    saveItem(item)

    return item
}

export function createWebSocketRequest(parentId: string): WebSocketItem {
    const item: WebSocketItem = {
        id: newId(),
        kind: 'websocket',
        parentId,
        name: 'Untitled WebSocket',
        order: nextOrder(items(), parentId),
        url: '',
    }

    saveItem(item)

    return item
}

/** Copies a request next to the original. */
export function duplicateRequest(item: HttpItem | WebSocketItem): Item {
    const copy = {
        ...item,
        id: newId(),
        name: `${item.name} Copy`,
        order: nextOrder(items(), item.parentId),
    }

    saveItem(copy)

    return copy
}

/** Changes fields of a request in this person's draft; Save sends them to everyone. */
export function updateRequest(item: HttpItem, changes: Partial<HttpRequest>): void {
    editDraftRequest(item.id, changes)
}

/** True when switching kind would drop something: HTTP settings, or a WebSocket URL. */
export function conversionLosesData(item: HttpItem | WebSocketItem): boolean {
    // Its URL carries over.
    if (item.kind === 'websocket') {
        return false
    }

    const { request } = item

    return (
        request.params.some((row) => !row.enabled) ||
        request.headers.length > 0 ||
        request.auth.type !== 'none' ||
        request.body.type !== 'none' ||
        request.method !== 'GET'
    )
}

/**
 * Switches a request between HTTP and WebSocket, keeping its name, place,
 * documentation, scripts and comments, and its URL.
 */
export function convertRequest(item: HttpItem | WebSocketItem, kind: 'http' | 'websocket'): void {
    if (item.kind === kind) {
        return
    }

    discardDraft(item.id)
    item = (items()[item.id] as HttpItem | WebSocketItem | undefined) ?? item

    const { id, parentId, name, order, description, scripts } = item
    const base = {
        id,
        parentId,
        name,
        order,
        ...(description === undefined ? {} : { description }),
        ...(scripts ? { scripts } : {}),
    }

    if (kind === 'websocket') {
        saveItem({
            ...base,
            kind: 'websocket',
            url: composeUrl((item as HttpItem).request),
        })
    } else {
        saveItem({
            ...base,
            kind: 'http',
            request: {
                ...newHttpRequest(),
                url: (item as WebSocketItem).url,
            },
        })
    }
}

/** Saves a copy of a request under another name, in any collection or folder. Comments stay with the original. */
export function saveRequestAs(
    item: HttpItem | WebSocketItem,
    name: string,
    parentId: string,
): Item {
    const copy = {
        ...item,
        id: newId(),
        name,
        parentId,
        order: nextOrder(items(), parentId),
    }

    saveItem(copy)

    return copy
}

// ── Workspace settings ───────────────────────────────────────────────────

export function saveWorkspaceSettings(settings: WorkspaceSettings): void {
    commit({
        type: 'put',
        entity: 'settings',
        doc: settings,
    })
}

// ── Environments ─────────────────────────────────────────────────────────

export function saveEnvironment(environment: Environment): void {
    commit({
        type: 'put',
        entity: 'environments',
        doc: environment,
    })
}

export function createEnvironment(): Environment {
    const environment: Environment = {
        id: newId(),
        name: 'New Environment',
        variables: [],
    }

    saveEnvironment(environment)

    return environment
}

/** Copies an environment, with its own variable rows, next to the original. */
export function duplicateEnvironment(environment: Environment): Environment {
    const copy: Environment = {
        ...environment,
        id: newId(),
        name: `${environment.name} Copy`.slice(0, MAX_NAME_LENGTH),
        variables: environment.variables.map((variable) => ({
            ...variable,
            id: newId(),
        })),
    }

    saveEnvironment(copy)

    return copy
}

export function deleteEnvironment(id: string): void {
    commit({
        type: 'delete',
        entity: 'environments',
        id,
    })
}

// ── Comments ─────────────────────────────────────────────────────────────

export function addComment(itemId: string, text: string): void {
    const user = useSession.getState().user

    if (!user) {
        return
    }

    // The server replaces the author and time; these are placeholders of the right shape.
    commit({
        type: 'put',
        entity: 'comments',
        doc: {
            id: newId(),
            itemId,
            text,
            userId: user.id,
            authorName: user.name,
            createdAt: Date.now(),
        },
    })
}

export function deleteComment(id: string): void {
    commit({
        type: 'delete',
        entity: 'comments',
        id,
    })
}
