import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test as nodeTest } from 'node:test'

import type { ClientChange, Item, User } from '#shared/types.ts'

// The config reads DATA_DIR when it loads, so point it at a scratch directory first.
process.env.DATA_DIR = mkdtempSync(path.join(tmpdir(), 'kynova-test-'))
const { register } = await import('./auth.ts')
const { applyChange, ChangeRejected, loadSnapshot, loadVersions } = await import('./docs.ts')
const { createWorkspace } = await import('./workspaces.ts')
const { runIn } = await import('#server/database/context.ts')
const { localTarget } = await import('#server/database/targets.ts')

// Everything here works on the local database, as a request for it would.
const local = await localTarget()
const test = (name: string, work: () => Promise<void>) => nodeTest(name, () => runIn(local, work))

const owner: User = await runIn(local, () => register('owner@test.dev', 'Owner', 'password1'))
const other: User = await runIn(local, () => register('other@test.dev', 'Other', 'password1'))
const workspaceId = (await runIn(local, () => createWorkspace(owner.id, 'Test'))).id

const item = (id: string, kind: Item['kind'], parentId: string | null): Item =>
    ({
        id,
        kind,
        parentId,
        name: id,
        order: 0,
        ...(kind === 'websocket' ? { url: '' } : {}),
    }) as Item
const put = (doc: Item): ClientChange => ({
    type: 'put',
    entity: 'items',
    doc,
})
const comment = (id: string, itemId: string, text = 'Hello'): ClientChange => ({
    type: 'put',
    entity: 'comments',
    doc: {
        id,
        itemId,
        text,
        userId: 'forged',
        authorName: 'Forged',
        createdAt: 1,
    },
})

test('an editor change is stored and returned as sent', async () => {
    const change = put(item('c1', 'collection', null))
    assert.deepEqual(await applyChange(workspaceId, owner, 'editor', change), [change])
    assert.equal((await loadSnapshot(workspaceId)).items.length, 1)
})

test('viewers cannot edit items or environments', async () => {
    await assert.rejects(
        applyChange(workspaceId, other, 'viewer', put(item('c2', 'collection', null))),
        ChangeRejected,
    )
    await assert.rejects(
        applyChange(workspaceId, other, 'viewer', {
            type: 'delete',
            entity: 'environments',
            id: 'e1',
        }),
        ChangeRejected,
    )
})

test('malformed items are rejected', async () => {
    const nested = {
        ...item('c3', 'collection', null),
        parentId: 'c1',
    } as unknown as Item
    const unknownKind = {
        ...item('x1', 'folder', 'c1'),
        kind: 'script',
    } as unknown as Item
    await assert.rejects(applyChange(workspaceId, owner, 'owner', put(nested)), ChangeRejected)
    await assert.rejects(applyChange(workspaceId, owner, 'owner', put(unknownKind)), ChangeRejected)
})

test('viewers can comment, and the server sets the author and time', async () => {
    await applyChange(workspaceId, owner, 'owner', put(item('r1', 'websocket', 'c1')))
    const [result] = await applyChange(
        workspaceId,
        other,
        'viewer',
        comment('k1', 'r1', '  Looks right  '),
    )

    assert.equal(result.type, 'put')
    const stored = (await loadSnapshot(workspaceId)).comments[0]
    assert.equal(stored.userId, other.id)
    assert.equal(stored.authorName, 'Other')
    assert.equal(stored.text, 'Looks right')
    assert.ok(stored.createdAt > 1)
})

test('comments cannot be edited or be empty', async () => {
    await assert.rejects(
        applyChange(workspaceId, other, 'viewer', comment('k1', 'r1', 'Edited')),
        ChangeRejected,
    )
    await assert.rejects(
        applyChange(workspaceId, other, 'viewer', comment('k2', 'r1', '   ')),
        ChangeRejected,
    )
})

test('only the author or the owner can delete a comment', async () => {
    const remove: ClientChange = {
        type: 'delete',
        entity: 'comments',
        id: 'k1',
    }
    const stranger: User = {
        ...owner,
        id: 'someone-else',
    }
    await assert.rejects(applyChange(workspaceId, stranger, 'editor', remove), ChangeRejected)
    assert.deepEqual(await applyChange(workspaceId, stranger, 'owner', remove), [remove])
})

test('an http request must carry a complete request', async () => {
    const noRequest = {
        id: 'h1',
        kind: 'http',
        parentId: 'c1',
        name: 'Broken',
        order: 0,
    } as unknown as Item
    const badHeaders = {
        ...noRequest,
        request: {
            method: 'GET',
            url: '',
            params: [],
            headers: 'nope',
            auth: { type: 'none' },
            body: { type: 'none' },
        },
    } as unknown as Item
    await assert.rejects(applyChange(workspaceId, owner, 'owner', put(noRequest)), ChangeRejected)
    await assert.rejects(applyChange(workspaceId, owner, 'owner', put(badHeaders)), ChangeRejected)
})

test('items can only be placed in a collection or folder that exists', async () => {
    await assert.rejects(
        applyChange(workspaceId, owner, 'owner', put(item('r9', 'websocket', 'r1'))),
        ChangeRejected,
    )
    await assert.rejects(
        applyChange(workspaceId, owner, 'owner', put(item('r9', 'websocket', 'ghost'))),
        ChangeRejected,
    )
})

test('a folder cannot be moved inside itself or its own contents', async () => {
    await applyChange(workspaceId, owner, 'owner', put(item('outer', 'folder', 'c1')))
    await applyChange(workspaceId, owner, 'owner', put(item('inner', 'folder', 'outer')))

    await assert.rejects(
        applyChange(workspaceId, owner, 'owner', put(item('outer', 'folder', 'inner'))),
        ChangeRejected,
    )
    await assert.rejects(
        applyChange(workspaceId, owner, 'owner', put(item('outer', 'folder', 'outer'))),
        ChangeRejected,
    )
    await applyChange(workspaceId, owner, 'owner', {
        type: 'delete',
        entity: 'items',
        id: 'outer',
    })
})

test('an item cannot change its kind', async () => {
    await assert.rejects(
        applyChange(workspaceId, owner, 'owner', put(item('r1', 'folder', 'c1'))),
        ChangeRejected,
    )
})

test('unknown entities and comments on missing requests are rejected', async () => {
    const unknownEntity = {
        type: 'delete',
        entity: 'users',
        id: 'x',
    } as unknown as ClientChange
    await assert.rejects(applyChange(workspaceId, owner, 'owner', unknownEntity), ChangeRejected)
    await assert.rejects(
        applyChange(workspaceId, owner, 'owner', comment('k9', 'ghost')),
        ChangeRejected,
    )
    await assert.rejects(
        applyChange(workspaceId, owner, 'owner', comment('k9', 'c1')),
        ChangeRejected,
    )
})

test('a request patch merges into the stored request', async () => {
    const request = {
        method: 'GET',
        url: 'https://a.dev',
        params: [],
        headers: [],
        auth: { type: 'none' },
        body: { type: 'none' },
    }
    await applyChange(
        workspaceId,
        owner,
        'owner',
        put({
            id: 'p1',
            kind: 'http',
            parentId: 'c1',
            name: 'P',
            order: 0,
            request,
        } as Item),
    )

    await applyChange(workspaceId, owner, 'editor', {
        type: 'patch',
        id: 'p1',
        changes: { url: 'https://b.dev' },
    })
    const [result] = await applyChange(workspaceId, other, 'owner', {
        type: 'patch',
        id: 'p1',
        changes: {
            method: 'POST',
            junk: 1,
        } as never,
    })

    assert.equal(result.type, 'put')
    const stored = (await loadSnapshot(workspaceId)).items.find((item) => item.id === 'p1')
    assert.ok(stored?.kind === 'http')
    assert.equal(stored.request.url, 'https://b.dev')
    assert.equal(stored.request.method, 'POST')
    assert.equal('junk' in stored.request, false)
})

test('request patches are refused for viewers, missing requests, and bad values', async () => {
    const patch = (changes: object, id = 'p1'): ClientChange =>
        ({
            type: 'patch',
            id,
            changes,
        }) as never
    await assert.rejects(
        applyChange(workspaceId, other, 'viewer', patch({ url: 'x' })),
        ChangeRejected,
    )
    await assert.rejects(
        applyChange(workspaceId, owner, 'owner', patch({ url: 'x' }, 'ghost')),
        ChangeRejected,
    )
    await assert.rejects(
        applyChange(workspaceId, owner, 'owner', patch({ url: 'x' }, 'c1')),
        ChangeRejected,
    )
    await assert.rejects(
        applyChange(workspaceId, owner, 'owner', patch({ method: 'TRACE' })),
        ChangeRejected,
    )
    await applyChange(workspaceId, owner, 'owner', {
        type: 'delete',
        entity: 'items',
        id: 'p1',
    })
})

test('descriptions, scripts, collection variables and key order are stored', async () => {
    const collection = {
        ...item('c9', 'collection', null),
        description: '',
        scripts: { preRequest: 'pm.variables.set("a", 1);' },
        variables: [
            {
                id: 'v1',
                key: 'base_url',
                value: 'http://x',
                enabled: true,
                type: 'string',
                description: 'host',
            },
        ],
        sourceId: 'abc',
        keyOrder: {
            collection: ['info', 'variable', 'item'],
            request: ['method', 'url'],
        },
    } as Item
    await applyChange(workspaceId, owner, 'owner', put(collection))
    const stored = (await loadSnapshot(workspaceId)).items.find((doc) => doc.id === 'c9')
    assert.deepEqual(stored, collection)
    await applyChange(workspaceId, owner, 'owner', {
        type: 'delete',
        entity: 'items',
        id: 'c9',
    })
})

test('malformed descriptions, scripts, variables and key order are refused', async () => {
    const base = item('c8', 'collection', null)
    for (const bad of [
        { description: 42 },
        { scripts: 'pm.test()' },
        { scripts: { test: ['line'] } },
        {
            variables: [
                {
                    id: 'v',
                    key: 'k',
                    value: 1,
                    enabled: true,
                },
            ],
        },
        {
            variables: [
                {
                    id: 'v',
                    key: 'k',
                    value: 'v',
                    enabled: true,
                    type: 7,
                },
            ],
        },
        { keyOrder: { request: 'method' } },
    ]) {
        await assert.rejects(
            applyChange(
                workspaceId,
                owner,
                'owner',
                put({
                    ...base,
                    ...bad,
                } as unknown as Item),
            ),
            ChangeRejected,
            JSON.stringify(bad),
        )
    }
})

test('a patch can set path variables', async () => {
    const request = {
        method: 'GET',
        url: '{{b}}/u/:id',
        params: [],
        headers: [],
        auth: { type: 'none' },
        body: { type: 'none' },
    }
    await applyChange(
        workspaceId,
        owner,
        'owner',
        put({
            id: 'pv',
            kind: 'http',
            parentId: 'c1',
            name: 'PV',
            order: 0,
            request,
        } as Item),
    )
    const pathVariables = [
        {
            id: 'p1',
            key: 'id',
            value: '7',
            enabled: true,
        },
    ]
    const [result] = await applyChange(workspaceId, owner, 'editor', {
        type: 'patch',
        id: 'pv',
        changes: { pathVariables },
    })
    assert.equal(result.type, 'put')
    const stored = (await loadSnapshot(workspaceId)).items.find((doc) => doc.id === 'pv')
    assert.ok(stored?.kind === 'http')
    assert.deepEqual(stored.request.pathVariables, pathVariables)
    await applyChange(workspaceId, owner, 'owner', {
        type: 'delete',
        entity: 'items',
        id: 'pv',
    })
})

test('only the owner can change workspace settings, and they must be well formed', async () => {
    const settings = {
        id: 'workspace',
        panels: { history: false },
        accentColor: '#3b72e1',
        theme: 'dark',
    } as const
    const put = (doc: object): ClientChange =>
        ({
            type: 'put',
            entity: 'settings',
            doc,
        }) as never

    await assert.rejects(applyChange(workspaceId, other, 'editor', put(settings)), ChangeRejected)
    await applyChange(workspaceId, owner, 'owner', put(settings))
    assert.deepEqual((await loadSnapshot(workspaceId)).settings, [settings])

    for (const bad of [
        { id: 'other' },
        {
            id: 'workspace',
            panels: { collections: false },
        },
        {
            id: 'workspace',
            panels: { history: 'no' },
        },
        {
            id: 'workspace',
            accentColor: 'red',
        },
        {
            id: 'workspace',
            theme: 'blue',
        },
    ]) {
        await assert.rejects(
            applyChange(workspaceId, owner, 'owner', put(bad)),
            ChangeRejected,
            JSON.stringify(bad),
        )
    }
    await assert.rejects(
        applyChange(workspaceId, other, 'editor', {
            type: 'delete',
            entity: 'settings',
            id: 'workspace',
        }),
        ChangeRejected,
    )
    await applyChange(workspaceId, owner, 'owner', {
        type: 'delete',
        entity: 'settings',
        id: 'workspace',
    })
    assert.deepEqual((await loadSnapshot(workspaceId)).settings, [])
})

test('a request can switch between HTTP and WebSocket; a folder still cannot change kind', async () => {
    await applyChange(workspaceId, owner, 'owner', put(item('sw', 'websocket', 'c1')))
    const request = {
        method: 'GET',
        url: 'ws://x',
        params: [],
        headers: [],
        auth: { type: 'none' },
        body: { type: 'none' },
    }
    await applyChange(
        workspaceId,
        owner,
        'owner',
        put({
            id: 'sw',
            kind: 'http',
            parentId: 'c1',
            name: 'sw',
            order: 0,
            request,
        } as Item),
    )
    await applyChange(workspaceId, owner, 'owner', put(item('sw', 'websocket', 'c1')))
    await assert.rejects(
        applyChange(workspaceId, owner, 'owner', put(item('sw', 'folder', 'c1'))),
        ChangeRejected,
    )
    await applyChange(workspaceId, owner, 'owner', {
        type: 'delete',
        entity: 'items',
        id: 'sw',
    })
})

test('a request may use a custom method, but not one fetch refuses', async () => {
    const request = (method: string) => ({
        method,
        url: 'https://x',
        params: [],
        headers: [],
        auth: { type: 'none' },
        body: { type: 'none' },
    })
    const doc = (method: string) =>
        ({
            id: 'cm',
            kind: 'http',
            parentId: 'c1',
            name: 'cm',
            order: 0,
            request: request(method),
        }) as Item
    await applyChange(workspaceId, owner, 'owner', put(doc('PROPFIND')))
    await assert.rejects(
        applyChange(workspaceId, owner, 'owner', put(doc('TRACE'))),
        ChangeRejected,
    )
    await assert.rejects(
        applyChange(workspaceId, owner, 'owner', put(doc('lower'))),
        ChangeRejected,
    )
    await applyChange(workspaceId, owner, 'owner', {
        type: 'delete',
        entity: 'items',
        id: 'cm',
    })
})

test('deleting an item moves it to the Archive with what it contains and their comments', async () => {
    await applyChange(workspaceId, owner, 'owner', put(item('f1', 'folder', 'c1')))
    await applyChange(workspaceId, owner, 'owner', put(item('r2', 'websocket', 'f1')))
    await applyChange(workspaceId, owner, 'owner', comment('k3', 'r2'))

    const remove: ClientChange = {
        type: 'delete',
        entity: 'items',
        id: 'c1',
    }
    const results = await applyChange(workspaceId, owner, 'owner', remove)

    assert.deepEqual(
        results
            .filter((change) => change.type === 'delete')
            .map((change) => change.type === 'delete' && `${change.entity}:${change.id}`)
            .sort(),
        ['comments:k3', 'items:c1', 'items:f1', 'items:r1', 'items:r2'],
    )

    const snapshot = await loadSnapshot(workspaceId)
    assert.deepEqual(snapshot.items, [])
    assert.deepEqual(snapshot.comments, [])
    const entry = snapshot.archive!.find(({ itemId }) => itemId === 'c1')!
    assert.equal(entry.itemId, 'c1')
    assert.equal(entry.deletedBy, 'Owner')
    assert.deepEqual(entry.items.map(({ id }) => id).sort(), ['c1', 'f1', 'r1', 'r2'])
    assert.deepEqual(
        entry.comments.map(({ id }) => id),
        ['k3'],
    )
})

test('restoring puts the item back with what it held, and empties its Archive entry', async () => {
    const entry = (await loadSnapshot(workspaceId)).archive!.find(({ itemId }) => itemId === 'c1')!

    await applyChange(workspaceId, other, 'editor', {
        type: 'restore',
        id: entry.id,
    })

    const snapshot = await loadSnapshot(workspaceId)
    assert.deepEqual(snapshot.items.map(({ id }) => id).sort(), ['c1', 'f1', 'r1', 'r2'])
    assert.deepEqual(
        snapshot.comments.map(({ id }) => id),
        ['k3'],
    )
    assert.equal(
        snapshot.archive!.some(({ id }) => id === entry.id),
        false,
    )
})

test('a save replaces the request content, keeps its place, and says who saved it', async () => {
    await applyChange(workspaceId, owner, 'owner', put(item('cs', 'collection', null)))
    await applyChange(workspaceId, owner, 'owner', put(item('s1', 'websocket', 'cs')))
    await applyChange(
        workspaceId,
        owner,
        'owner',
        put({
            ...item('s1', 'websocket', 'cs'),
            name: 'Renamed',
        }),
    )

    const [saved] = await applyChange(workspaceId, other, 'editor', {
        type: 'save',
        doc: {
            ...item('s1', 'websocket', 'cs'),
            name: 'Stale name',
            url: 'wss://echo.test',
        } as Item & { kind: 'websocket' },
    })

    assert.equal(saved.type, 'put')
    const stored = (await loadSnapshot(workspaceId)).items.find(({ id }) => id === 's1')!
    assert.equal(stored.kind === 'websocket' && stored.url, 'wss://echo.test')
    assert.equal(stored.name, 'Renamed')
    assert.equal(stored.savedBy, 'Other')
    assert.ok((stored.savedAt ?? 0) > 1)
})

test('a plain put cannot forge or drop who saved a request', async () => {
    await applyChange(
        workspaceId,
        owner,
        'owner',
        put({
            ...item('s1', 'websocket', 'cs'),
            name: 'Again',
            savedBy: 'Forged',
            savedAt: 1,
        }),
    )

    const stored = (await loadSnapshot(workspaceId)).items.find(({ id }) => id === 's1')!
    assert.equal(stored.savedBy, 'Other')
    assert.notEqual(stored.savedAt, 1)
})

test('viewers cannot save, and a missing request cannot be saved', async () => {
    const save = (id: string): ClientChange => ({
        type: 'save',
        doc: item(id, 'websocket', 'cs') as Item & { kind: 'websocket' },
    })

    await assert.rejects(applyChange(workspaceId, other, 'viewer', save('s1')), ChangeRejected)
    await assert.rejects(applyChange(workspaceId, owner, 'owner', save('nope')), ChangeRejected)
})

test('each save is a version; the first keeps what it replaced; only the last 10 stay', async () => {
    await applyChange(workspaceId, owner, 'owner', put(item('cv', 'collection', null)))
    await applyChange(
        workspaceId,
        owner,
        'owner',
        put({
            ...item('v1', 'websocket', 'cv'),
            url: 'wss://before',
        } as Item),
    )

    const save = (url: string): ClientChange => ({
        type: 'save',
        doc: {
            ...item('v1', 'websocket', 'cv'),
            url,
        } as Item & { kind: 'websocket' },
    })

    await applyChange(workspaceId, other, 'editor', save('wss://first'))
    let versions = await loadVersions(workspaceId, 'v1')
    assert.deepEqual(
        versions.map((version) => version.url),
        ['wss://first', 'wss://before'],
    )
    assert.equal(versions[0].savedBy, 'Other')
    assert.equal(versions[1].savedBy, 'Before history')

    for (let n = 1; n <= 12; n++) {
        await applyChange(workspaceId, owner, 'owner', save(`wss://save-${n}`))
    }

    versions = await loadVersions(workspaceId, 'v1')
    assert.equal(versions.length, 10)
    assert.equal(versions[0].url, 'wss://save-12')
    assert.equal(versions[0].savedBy, 'Owner')
    assert.equal(new Set(versions.map((version) => version.savedAt)).size, 10)
})

test('versions are not part of the synced snapshot', async () => {
    const snapshot = await loadSnapshot(workspaceId)
    assert.deepEqual(Object.keys(snapshot).sort(), [
        'archive',
        'comments',
        'environments',
        'items',
        'settings',
    ])
})

test('a request whose folder is gone comes back in its collection; with its collection gone it waits', async () => {
    await applyChange(workspaceId, owner, 'owner', put(item('ca', 'collection', null)))
    await applyChange(workspaceId, owner, 'owner', put(item('fa', 'folder', 'ca')))
    await applyChange(workspaceId, owner, 'owner', put(item('ra', 'websocket', 'fa')))

    const remove = (id: string): ClientChange => ({
        type: 'delete',
        entity: 'items',
        id,
    })
    const entryOf = async (itemId: string) =>
        (await loadSnapshot(workspaceId)).archive!.find((entry) => entry.itemId === itemId)!
    const restore = async (itemId: string) =>
        applyChange(workspaceId, owner, 'owner', {
            type: 'restore',
            id: (await entryOf(itemId)).id,
        })

    await applyChange(workspaceId, owner, 'owner', remove('ra'))
    await applyChange(workspaceId, owner, 'owner', remove('fa'))
    await restore('ra')

    const back = (await loadSnapshot(workspaceId)).items.find(({ id }) => id === 'ra')!
    assert.equal(back.parentId, 'ca')

    await applyChange(workspaceId, owner, 'owner', remove('ra'))
    await applyChange(workspaceId, owner, 'owner', remove('ca'))
    await assert.rejects(restore('ra'), ChangeRejected)
})

test('viewers cannot restore; the Archive cannot be written to; deleting from it is for good', async () => {
    const { archive } = await loadSnapshot(workspaceId)
    const entry = archive!.find((candidate) => candidate.itemId === 'ra')!

    await assert.rejects(
        applyChange(workspaceId, other, 'viewer', {
            type: 'restore',
            id: entry.id,
        }),
        ChangeRejected,
    )
    await assert.rejects(
        applyChange(workspaceId, owner, 'owner', {
            type: 'put',
            entity: 'archive',
            doc: entry,
        }),
        ChangeRejected,
    )

    await applyChange(workspaceId, owner, 'owner', {
        type: 'delete',
        entity: 'archive',
        id: entry.id,
    })
    assert.equal(
        (await loadSnapshot(workspaceId)).archive!.some(({ id }) => id === entry.id),
        false,
    )
})
