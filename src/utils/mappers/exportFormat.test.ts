import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { HttpItem, Item } from '#shared/types.ts'

import {
    COLLECTION_ID_KEY,
    COLLECTION_SCHEMA,
    exportCollection,
    importCollection,
} from './exportFormat'

const COLLECTION_FILE = JSON.stringify({
    info: {
        name: 'Shop',
        schema: COLLECTION_SCHEMA,
    },
    item: [
        {
            name: 'Orders',
            item: [
                {
                    name: 'Create order',
                    request: {
                        method: 'POST',
                        header: [
                            {
                                key: 'X-Trace',
                                value: '1',
                                disabled: true,
                            },
                        ],
                        url: {
                            raw: '{{base}}/orders?dryRun=true',
                            query: [
                                {
                                    key: 'dryRun',
                                    value: 'true',
                                },
                            ],
                        },
                        auth: {
                            type: 'bearer',
                            bearer: [
                                {
                                    key: 'token',
                                    value: '{{token}}',
                                    type: 'string',
                                },
                            ],
                        },
                        body: {
                            mode: 'raw',
                            raw: '{"sku":"A1"}',
                            options: { raw: { language: 'json' } },
                        },
                    },
                },
            ],
        },
        {
            name: 'Health',
            request: 'https://shop.dev/health?deep=1',
        },
    ],
})

const byName = (items: Item[], name: string) => items.find((item) => item.name === name)!

test('imports folders and requests into a tree under a new collection', () => {
    const items = importCollection(COLLECTION_FILE, 3)
    const [collection] = items
    assert.equal(collection.kind, 'collection')
    assert.equal(collection.name, 'Shop')
    assert.equal(collection.parentId, null)
    assert.equal(collection.order, 3)

    const folder = byName(items, 'Orders')
    assert.equal(folder.kind, 'folder')
    assert.equal(folder.parentId, collection.id)
    assert.equal(byName(items, 'Create order').parentId, folder.id)
})

test('imports the request: query moves to params, auth and body are kept', () => {
    const { request } = byName(importCollection(COLLECTION_FILE, 0), 'Create order') as HttpItem
    assert.equal(request.method, 'POST')
    assert.equal(request.url, '{{base}}/orders')
    assert.deepEqual(
        request.params.map(({ key, value }) => [key, value]),
        [['dryRun', 'true']],
    )
    assert.deepEqual(
        request.headers.map(({ key, enabled }) => [key, enabled]),
        [['X-Trace', false]],
    )
    assert.deepEqual(request.auth, {
        type: 'bearer',
        token: '{{token}}',
    })
    assert.deepEqual(request.body, {
        type: 'raw',
        language: 'json',
        text: '{"sku":"A1"}',
    })
})

test('imports a request given as a plain URL string', () => {
    const { request } = byName(importCollection(COLLECTION_FILE, 0), 'Health') as HttpItem
    assert.equal(request.method, 'GET')
    assert.equal(request.url, 'https://shop.dev/health')
    assert.deepEqual(
        request.params.map(({ key, value }) => [key, value]),
        [['deep', '1']],
    )
})

test('rejects files that are not a collection', () => {
    assert.throws(() => importCollection('not json', 0), /not valid JSON/)
    assert.throws(() => importCollection('{"hello":1}', 0), /not a Collection v2.1/)
})

test('an exported collection imports back to the same requests', () => {
    const original = importCollection(COLLECTION_FILE, 0)
    const itemsById = Object.fromEntries(original.map((item) => [item.id, item]))
    const roundTripped = importCollection(exportCollection(itemsById, original[0].id), 0)

    // Ids are regenerated on import, and the recorded key order describes the file, not the requests.
    const strip = (items: Item[]) =>
        JSON.parse(
            JSON.stringify(items, (key, value) =>
                ['id', 'parentId', 'keyOrder'].includes(key) ? undefined : value,
            ),
        )
    assert.deepEqual(strip(roundTripped), strip(original))
})

// ── Round trips: a file imported and exported again is the same file ─────

const toItemsById = (items: Item[]) => Object.fromEntries(items.map((item) => [item.id, item]))
const roundTrip = (file: object) => {
    const items = importCollection(JSON.stringify(file), 0)
    return exportCollection(toItemsById(items), items[0].id)
}

/** Written the way the user's own collections are: variables first, events last, an empty description kept. */
const SCRIPTED_FILE = {
    info: {
        name: 'API',
        description: 'Run **in order**.',
        schema: COLLECTION_SCHEMA,
    },
    variable: [
        {
            key: 'base_url',
            value: 'http://localhost:7100',
            type: 'string',
        },
        {
            key: 'token',
            value: '',
        },
    ],
    item: [
        {
            name: 'Auth',
            description: '',
            item: [
                {
                    name: 'Login',
                    request: {
                        method: 'POST',
                        header: [
                            {
                                key: 'Content-Type',
                                value: 'application/json',
                            },
                        ],
                        url: {
                            raw: '{{base_url}}/login?debug=1',
                            host: ['{{base_url}}'],
                            path: ['login'],
                            query: [
                                {
                                    key: 'debug',
                                    value: '1',
                                },
                            ],
                        },
                        description: 'Signs in.',
                        body: {
                            mode: 'raw',
                            raw: '{"id":"{{$guid}}"}',
                            options: { raw: { language: 'json' } },
                        },
                    },
                    response: [],
                    event: [
                        {
                            listen: 'prerequest',
                            script: {
                                type: 'text/javascript',
                                exec: ['pm.variables.set("a", 1);'],
                            },
                        },
                        {
                            listen: 'test',
                            script: {
                                type: 'text/javascript',
                                exec: ['(function () {', '  pm.test("ok");', '})();'],
                            },
                        },
                    ],
                },
                {
                    name: 'Get user',
                    request: {
                        method: 'GET',
                        header: [],
                        url: {
                            raw: '{{base_url}}/users/:id',
                            host: ['{{base_url}}'],
                            path: ['users', ':id'],
                            variable: [
                                {
                                    key: 'id',
                                    value: '{{user_id}}',
                                    description: 'filled by Login',
                                },
                            ],
                        },
                        description: '',
                    },
                    response: [],
                },
            ],
        },
    ],
    event: [
        {
            listen: 'prerequest',
            script: {
                type: 'text/javascript',
                exec: [],
            },
        },
    ],
}

/** Written the way the desktop app exports: events before requests, body before url, variables last. */
const APP_EXPORT_FILE = {
    info: {
        [COLLECTION_ID_KEY]: 'b1c2',
        name: 'App export',
        schema: COLLECTION_SCHEMA,
        _exporter_id: '123',
        _collection_link: 'https://x',
    },
    item: [
        {
            name: 'Create',
            event: [
                {
                    listen: 'test',
                    script: {
                        type: 'text/javascript',
                        exec: ['pm.test("201");'],
                    },
                },
            ],
            request: {
                method: 'POST',
                header: [],
                body: {
                    mode: 'raw',
                    raw: '{}',
                    options: { raw: { language: 'json' } },
                },
                url: {
                    raw: 'https://api.dev:8443/items',
                    protocol: 'https',
                    host: ['api', 'dev'],
                    port: '8443',
                    path: ['items'],
                },
            },
            response: [],
        },
    ],
    variable: [
        {
            key: 'base_url',
            value: 'https://api.dev',
        },
    ],
}

test('a collection with scripts, descriptions and variables exports unchanged, key order included', () => {
    assert.equal(roundTrip(SCRIPTED_FILE), JSON.stringify(SCRIPTED_FILE, null, 2))
})

test("an app export keeps its own key order; only the app's account ids are dropped", () => {
    const { _exporter_id, _collection_link, ...info } = APP_EXPORT_FILE.info
    assert.equal(
        roundTrip(APP_EXPORT_FILE),
        JSON.stringify(
            {
                ...APP_EXPORT_FILE,
                info,
            },
            null,
            2,
        ),
    )
})

test('import keeps descriptions, scripts, collection variables and path variables', () => {
    const items = importCollection(JSON.stringify(SCRIPTED_FILE), 0)
    const [collection] = items
    assert.ok(collection.kind === 'collection')
    assert.equal(collection.description, 'Run **in order**.')
    assert.deepEqual(collection.scripts, { preRequest: '' })
    assert.deepEqual(
        collection.variables?.map(({ key, value, type }) => ({
            key,
            value,
            type,
        })),
        [
            {
                key: 'base_url',
                value: 'http://localhost:7100',
                type: 'string',
            },
            {
                key: 'token',
                value: '',
                type: undefined,
            },
        ],
    )

    assert.equal(byName(items, 'Auth').description, '')
    const login = byName(items, 'Login') as HttpItem
    assert.equal(login.description, 'Signs in.')
    assert.deepEqual(login.scripts, {
        preRequest: 'pm.variables.set("a", 1);',
        test: '(function () {\n  pm.test("ok");\n})();',
    })

    const getUser = byName(items, 'Get user') as HttpItem
    assert.equal(getUser.request.url, '{{base_url}}/users/:id')
    assert.deepEqual(
        getUser.request.pathVariables?.map(({ key, value, description }) => ({
            key,
            value,
            description,
        })),
        [
            {
                key: 'id',
                value: '{{user_id}}',
                description: 'filled by Login',
            },
        ],
    )
})

test('a collection made in Kynova exports in the app key order', () => {
    const collection: Item = {
        id: 'c',
        kind: 'collection',
        parentId: null,
        name: 'New',
        order: 0,
        variables: [],
    }
    const request: Item = {
        id: 'r',
        kind: 'http',
        parentId: 'c',
        name: 'Ping',
        order: 0,
        scripts: { test: 'pm.test("ok");' },
        request: {
            method: 'GET',
            url: 'https://api.dev/ping',
            params: [],
            headers: [],
            auth: { type: 'none' },
            body: {
                type: 'raw',
                language: 'text',
                text: 'hi',
            },
        },
    }
    const exported = JSON.parse(exportCollection(toItemsById([collection, request]), 'c'))
    assert.deepEqual(Object.keys(exported), ['info', 'item'])
    assert.deepEqual(Object.keys(exported.item[0]), ['name', 'event', 'request', 'response'])
    assert.deepEqual(Object.keys(exported.item[0].request), ['method', 'header', 'body', 'url'])
    assert.deepEqual(exported.item[0].request.url, {
        raw: 'https://api.dev/ping',
        protocol: 'https',
        host: ['api', 'dev'],
        path: ['ping'],
    })
})

test('every auth type round-trips with its settings, flags and parameter tables', () => {
    const auths = [
        {
            type: 'digest',
            digest: [
                {
                    key: 'algorithm',
                    value: 'MD5',
                    type: 'string',
                },
                {
                    key: 'disableRetryRequest',
                    value: true,
                    type: 'boolean',
                },
                {
                    key: 'password',
                    value: 'p',
                    type: 'string',
                },
            ],
        },
        {
            type: 'jwt',
            jwt: [
                {
                    key: 'payload',
                    value: '{"a":1}',
                    type: 'string',
                },
                {
                    key: 'isSecretBase64Encoded',
                    value: false,
                    type: 'boolean',
                },
            ],
        },
        {
            type: 'oauth2',
            oauth2: [
                {
                    key: 'tokenRequestParams',
                    value: [
                        {
                            key: 'audience',
                            value: 'api',
                            enabled: true,
                            send_as: 'request_body',
                        },
                    ],
                    type: 'any',
                },
                {
                    key: 'grant_type',
                    value: 'client_credentials',
                    type: 'string',
                },
                {
                    key: 'someFutureSetting',
                    value: 'kept',
                    type: 'string',
                },
            ],
        },
        {
            type: 'ntlm',
            ntlm: [
                {
                    key: 'username',
                    value: 'u',
                    type: 'string',
                },
            ],
        },
    ]
    const file = {
        info: {
            name: 'Auth',
            schema: COLLECTION_SCHEMA,
        },
        item: auths.map((auth, index) => ({
            name: `R${index}`,
            request: {
                auth,
                method: 'GET',
                header: [],
                url: {
                    raw: 'https://a.example',
                    protocol: 'https',
                    host: ['a', 'example'],
                },
            },
            response: [],
        })),
    }
    const items = importCollection(JSON.stringify(file), 0)
    const digest = items.find((item) => item.name === 'R0') as HttpItem
    assert.deepEqual(digest.request.auth, {
        type: 'digest',
        values: {
            algorithm: 'MD5',
            disableRetryRequest: true,
            password: 'p',
        },
    })
    assert.equal(roundTrip(file), JSON.stringify(file, null, 2))
})
