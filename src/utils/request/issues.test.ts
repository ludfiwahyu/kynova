import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { Environment, HttpRequest, Item } from '#shared/types.ts'

import { findIssues } from './issues'

const row = (key: string, value: string, enabled = true) => ({
    id: `${key}-${value}`,
    key,
    value,
    enabled,
})

function request(id: string, changes: Partial<HttpRequest>, parentId = 'c1'): Item {
    return {
        id,
        parentId,
        name: id,
        order: 0,
        kind: 'http',
        request: {
            method: 'GET',
            url: 'https://api.dev/x',
            params: [],
            headers: [],
            auth: { type: 'none' },
            body: { type: 'none' },
            ...changes,
        },
    }
}

const collection: Item = {
    id: 'c1',
    parentId: null,
    name: 'Shop',
    order: 0,
    kind: 'collection',
    variables: [row('base', 'https://api.dev')],
}

const issuesOf = (items: Item[], environments: Environment[] = [], active?: Environment) =>
    findIssues(
        Object.fromEntries([collection, ...items].map((item) => [item.id, item])),
        Object.fromEntries(environments.map((e) => [e.id, e])),
        active,
    ).map(({ severity, where, message }) => `${severity} ${where}: ${message}`)

test('a healthy workspace has no issues', () => {
    assert.deepEqual(
        issuesOf(
            [
                request('ok', {
                    url: '{{base}}/x',
                    body: {
                        type: 'raw',
                        language: 'json',
                        text: '{"id": {{id}}}',
                    },
                }),
            ],
            [],
            {
                id: 'e',
                name: 'Dev',
                variables: [row('id', '1')],
            },
        ),
        [],
    )
})

test('finds invalid JSON bodies and JWT JSON as errors, empty URLs and path variables as warnings', () => {
    const issues = issuesOf([
        request('empty', { url: ' ' }),
        request('json', {
            body: {
                type: 'raw',
                language: 'json',
                text: '{"a": 1,}',
            },
        }),
        request('text', {
            body: {
                type: 'raw',
                language: 'text',
                text: '{"a": 1,}',
            },
        }),
        request('jwt', {
            auth: {
                type: 'jwt',
                values: {
                    payload: '{nope',
                    header: '{}',
                },
            },
        }),
        request('path', { url: 'https://api.dev/users/:id' }),
    ])
    assert.equal(issues.length, 4)
    assert.match(issues[0], /^error Shop \/ json: The JSON body is not valid: /)
    assert.match(issues[1], /^error Shop \/ jwt: The JWT payload is not valid JSON: /)
    assert.equal(issues[2], 'warning Shop / empty: The URL is empty.')
    assert.equal(issues[3], 'warning Shop / path: :id has no value, so the URL is sent as written.')
})

test('names variables with no value, wherever they are used', () => {
    const [issue] = issuesOf([
        request('vars', {
            url: '{{base}}/{{version}}',
            headers: [row('Authorization', 'Bearer {{token}}'), row('X-Off', '{{ignored}}', false)],
            auth: {
                type: 'oauth2',
                values: {
                    accessToken: '{{token}}',
                    headerPrefix: '{{prefix}}',
                },
            },
            body: {
                type: 'urlencoded',
                fields: [row('a', '{{$guid}}')],
            },
        }),
    ])
    assert.equal(
        issue,
        'warning Shop / vars: {{version}}, {{token}}, {{prefix}} have no value in the collection or the active environment.',
    )
})

test('the active environment fills variables in', () => {
    const env = {
        id: 'e1',
        name: 'Dev',
        variables: [row('token', 't')],
    }
    assert.deepEqual(issuesOf([request('r', { url: '{{base}}/{{token}}' })], [env], env), [])
    assert.equal(
        issuesOf([request('r', { url: '{{base}}/{{token}}' })], [env]).length,
        1,
        'not when another environment is active',
    )
})

test('flags repeated variable names and bad WebSocket URLs', () => {
    const issues = issuesOf(
        [
            {
                id: 'ws',
                parentId: 'c1',
                name: 'Live',
                order: 1,
                kind: 'websocket',
                url: 'https://not-ws',
            },
        ],
        [
            {
                id: 'e1',
                name: 'Dev',
                variables: [row('a', '1'), row('a', '2'), row('b', '3', false), row('b', '4')],
            },
        ],
    )
    assert.deepEqual(issues, [
        'error Shop / Live: The WebSocket URL must start with ws:// or wss://.',
        'warning Dev: Variables a are set more than once; the last one wins.',
    ])
})
