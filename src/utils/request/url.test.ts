import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { HttpRequest, KeyValue } from '#shared/types.ts'

import { applyUrlText, composeUrl, syncPathVariables } from './url'

const row = (
    id: string,
    key: string,
    value: string,
    enabled = true,
    description?: string,
): KeyValue => ({
    id,
    key,
    value,
    enabled,
    ...(description === undefined ? {} : { description }),
})

function request(changes: Partial<HttpRequest> = {}): HttpRequest {
    return {
        method: 'GET',
        url: 'https://api.dev/users',
        params: [],
        headers: [],
        auth: { type: 'none' },
        body: { type: 'none' },
        ...changes,
    }
}

test('the URL bar shows the switched-on params, as written', () => {
    const shown = composeUrl(
        request({
            params: [row('a', 'q', '{{term}}'), row('b', 'off', '1', false), row('c', 'page', '2')],
        }),
    )
    assert.equal(shown, 'https://api.dev/users?q={{term}}&page=2')
})

test('typing a query fills the switched-on params in place; switched-off ones keep their place', () => {
    const before = request({
        params: [row('a', 'q', 'x', true, 'search text'), row('b', 'off', '1', false)],
    })
    const after = applyUrlText(before, 'https://api.dev/users?q=y&limit=10')

    assert.equal(after.url, 'https://api.dev/users')
    assert.deepEqual(
        after.params.map(({ id, key, value, enabled, description }) => [
            ['a', 'b'].includes(id) ? id : 'new',
            key,
            value,
            enabled,
            description,
        ]),
        [
            ['a', 'q', 'y', true, 'search text'],
            ['b', 'off', '1', false, undefined],
            ['new', 'limit', '10', true, undefined],
        ],
    )
})

test('removing the query keeps switched-off params', () => {
    const after = applyUrlText(
        request({ params: [row('a', 'q', 'x'), row('b', 'off', '1', false)] }),
        'https://api.dev/users',
    )
    assert.deepEqual(
        after.params.map((param) => param.key),
        ['off'],
    )
})

test('path variables follow the :name segments, keeping values and descriptions', () => {
    const existing = [row('a', 'id', '{{account_id}}', true, 'account'), row('b', 'gone', 'x')]
    const synced = syncPathVariables(
        '{{base_url}}/accounts/:id/posts/:postId?x=:notAPath',
        existing,
    )
    assert.deepEqual(
        synced.map(({ key, value, description }) => [key, value, description]),
        [
            ['id', '{{account_id}}', 'account'],
            ['postId', '', undefined],
        ],
    )
})

test('typing the URL updates path variables too', () => {
    const after = applyUrlText(
        request({
            url: '{{base_url}}/a',
            pathVariables: [],
        }),
        '{{base_url}}/a/:id',
    )
    assert.deepEqual(
        after.pathVariables?.map((variable) => variable.key),
        ['id'],
    )
})

test('a switched-off param between two others stays between them', () => {
    const before = request({ params: [row('a', 'page', '2', false), row('b', 'limit', '5')] })
    const after = applyUrlText(before, 'https://api.dev/users?limit=50')
    assert.deepEqual(
        after.params.map(({ key, value, enabled }) => [key, value, enabled]),
        [
            ['page', '2', false],
            ['limit', '50', true],
        ],
    )
})
