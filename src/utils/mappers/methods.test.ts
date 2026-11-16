import assert from 'node:assert/strict'
import { test } from 'node:test'

import { isHttpMethod, parseMethod } from '#shared/methods.ts'
import type { HttpItem } from '#shared/types.ts'

import { COLLECTION_SCHEMA, exportCollection, importCollection } from './exportFormat'

test('any method token is a method; ones fetch refuses are not', () => {
    for (const method of ['GET', 'PROPFIND', 'PURGE', 'M-SEARCH', 'X_CUSTOM']) {
        assert.ok(isHttpMethod(method), method)
    }
    for (const method of ['get', 'CONNECT', 'TRACE', 'TRACK', 'TWO WORDS', '', 'A'.repeat(25)]) {
        assert.ok(!isHttpMethod(method), method)
    }
})

test('typed text becomes a method in capitals, or an explanation', () => {
    assert.deepEqual(parseMethod('  propfind '), { method: 'PROPFIND' })
    assert.ok('error' in parseMethod('trace'))
    assert.ok('error' in parseMethod('two words'))
    assert.ok('error' in parseMethod(''))
})

test('a custom method survives import and export', () => {
    const file = {
        info: {
            name: 'DAV',
            schema: COLLECTION_SCHEMA,
        },
        item: [
            {
                name: 'List',
                request: {
                    method: 'PROPFIND',
                    header: [],
                    url: { raw: 'https://dav.dev/files' },
                },
            },
        ],
    }
    const items = importCollection(JSON.stringify(file), 0)
    assert.equal((items[1] as HttpItem).request.method, 'PROPFIND')
    const exported = JSON.parse(
        exportCollection(Object.fromEntries(items.map((item) => [item.id, item])), items[0].id),
    )
    assert.equal(exported.item[0].request.method, 'PROPFIND')
})

test('a method Kynova cannot send imports as GET', () => {
    const file = {
        info: {
            name: 'Bad',
            schema: COLLECTION_SCHEMA,
        },
        item: [
            {
                name: 'Trace',
                request: {
                    method: 'TRACE',
                    url: 'https://x.dev',
                },
            },
        ],
    }
    assert.equal((importCollection(JSON.stringify(file), 0)[1] as HttpItem).request.method, 'GET')
})
