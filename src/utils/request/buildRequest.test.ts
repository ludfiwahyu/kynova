import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { HttpRequest } from '#shared/types.ts'

import { buildSendRequest } from './buildRequest'

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

const row = (key: string, value: string, enabled = true) => ({
    id: key,
    key,
    value,
    enabled,
})

test('appends enabled params, encoded, and skips disabled ones', () => {
    const sent = buildSendRequest(
        request({ params: [row('q', 'a b&c'), row('off', '1', false)] }),
        {},
    )
    assert.equal(sent.url, 'https://api.dev/users?q=a%20b%26c')
})

test('joins params with & when the URL already has a query', () => {
    const sent = buildSendRequest(
        request({
            url: 'https://api.dev/users?page=2',
            params: [row('q', 'x')],
        }),
        {},
    )
    assert.equal(sent.url, 'https://api.dev/users?page=2&q=x')
})

test('adds http:// when the URL has no protocol', () => {
    assert.equal(
        buildSendRequest(request({ url: 'localhost:3000/ping' }), {}).url,
        'http://localhost:3000/ping',
    )
})

test('fills variables in the URL, headers and body', () => {
    const sent = buildSendRequest(
        request({
            method: 'POST',
            url: '{{base}}/users',
            headers: [row('X-Tenant', '{{tenant}}')],
            body: {
                type: 'raw',
                language: 'json',
                text: '{"tenant":"{{tenant}}"}',
            },
        }),
        {
            base: 'https://api.dev',
            tenant: 'acme',
        },
    )
    assert.equal(sent.url, 'https://api.dev/users')
    assert.deepEqual(sent.headers, [
        ['X-Tenant', 'acme'],
        ['Content-Type', 'application/json'],
    ])
    assert.equal(sent.body, '{"tenant":"acme"}')
})

test('bearer and basic auth become an Authorization header', () => {
    const bearer = buildSendRequest(
        request({
            auth: {
                type: 'bearer',
                token: 'abc',
            },
        }),
        {},
    )
    assert.deepEqual(bearer.headers, [['Authorization', 'Bearer abc']])

    const basic = buildSendRequest(
        request({
            auth: {
                type: 'basic',
                username: 'ana',
                password: 'pässword',
            },
        }),
        {},
    )
    assert.deepEqual(basic.headers, [
        ['Authorization', `Basic ${Buffer.from('ana:pässword').toString('base64')}`],
    ])
})

test('an API key goes to a header or the query, as chosen', () => {
    const inHeader = buildSendRequest(
        request({
            auth: {
                type: 'apikey',
                key: 'X-Key',
                value: 'k',
                addTo: 'header',
            },
        }),
        {},
    )
    assert.deepEqual(inHeader.headers, [['X-Key', 'k']])

    const inQuery = buildSendRequest(
        request({
            auth: {
                type: 'apikey',
                key: 'key',
                value: 'k',
                addTo: 'query',
            },
        }),
        {},
    )
    assert.equal(inQuery.url, 'https://api.dev/users?key=k')
    assert.deepEqual(inQuery.headers, [])
})

test('headers set by the user win over auth and body defaults', () => {
    const sent = buildSendRequest(
        request({
            headers: [
                row('authorization', 'Custom x'),
                row('content-type', 'application/vnd.api+json'),
            ],
            auth: {
                type: 'bearer',
                token: 'abc',
            },
            body: {
                type: 'raw',
                language: 'json',
                text: '{}',
            },
        }),
        {},
    )
    assert.deepEqual(sent.headers, [
        ['authorization', 'Custom x'],
        ['content-type', 'application/vnd.api+json'],
    ])
})

test('a urlencoded body is encoded from its enabled fields', () => {
    const sent = buildSendRequest(
        request({
            method: 'POST',
            body: {
                type: 'urlencoded',
                fields: [row('name', 'Ana Putri'), row('skip', 'x', false)],
            },
        }),
        {},
    )
    assert.equal(sent.body, 'name=Ana%20Putri')
    assert.deepEqual(sent.headers, [['Content-Type', 'application/x-www-form-urlencoded']])
})

test('path variables fill their :name segments, encoded; unknown or empty ones stay', () => {
    const sent = buildSendRequest(
        request({
            url: '{{base}}/accounts/:id/files/:name/:missing',
            pathVariables: [row('id', '{{account_id}}'), row('name', 'a b/c'), row('missing', '')],
        }),
        {
            base: 'https://api.dev',
            account_id: '42',
        },
    )
    assert.equal(sent.url, 'https://api.dev/accounts/42/files/a%20b%2Fc/:missing')
})

test('a port in the URL is not mistaken for a path variable', () => {
    const sent = buildSendRequest(
        request({
            url: 'http://localhost:7100/livez',
            pathVariables: [row('7100', 'x')],
        }),
        {},
    )
    assert.equal(sent.url, 'http://localhost:7100/livez')
})

test('{{$guid}} gets a fresh value each time it appears', () => {
    const sent = buildSendRequest(
        request({
            method: 'POST',
            body: {
                type: 'raw',
                language: 'json',
                text: '["{{$guid}}","{{$guid}}"]',
            },
        }),
        {},
    )
    const [first, second] = JSON.parse(sent.body!)
    assert.match(first, /^[0-9a-f-]{36}$/)
    assert.notEqual(first, second)
})

test('OAuth 2.0 sends its token with the header prefix, or as access_token in the URL', () => {
    const values = {
        accessToken: '{{token}}',
        headerPrefix: 'Bearer',
    }
    const inHeader = buildSendRequest(
        request({
            auth: {
                type: 'oauth2',
                values,
            },
        }),
        { token: 't1' },
    )
    assert.deepEqual(inHeader.headers, [['Authorization', 'Bearer t1']])

    const inUrl = buildSendRequest(
        request({
            auth: {
                type: 'oauth2',
                values: {
                    ...values,
                    addTokenTo: 'queryParams',
                },
            },
        }),
        { token: 't1' },
    )
    assert.equal(inUrl.url, 'https://api.dev/users?access_token=t1')
    assert.deepEqual(inUrl.headers, [])

    const noToken = buildSendRequest(
        request({
            auth: {
                type: 'oauth2',
                values: {},
            },
        }),
        {},
    )
    assert.deepEqual(noToken.headers, [])
    assert.equal(noToken.auth, undefined)
})

test('auth the server signs goes with the request, variables filled in and tables left out', () => {
    const sent = buildSendRequest(
        request({
            auth: {
                type: 'awsv4',
                values: {
                    accessKey: '{{key}}',
                    addAuthDataToQuery: false,
                    rows: [
                        {
                            key: 'a',
                            value: 'b',
                        },
                    ],
                },
            },
        }),
        { key: 'AK' },
    )
    assert.deepEqual(sent.auth, {
        type: 'awsv4',
        values: {
            accessKey: 'AK',
            addAuthDataToQuery: false,
        },
    })
    assert.deepEqual(sent.headers, [], 'the server adds the signature')
})
