import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { SendRequest } from '#shared/types.ts'

import { generateSnippet, SNIPPET_LANGUAGES } from './codegen'

const REQUEST: SendRequest = {
    method: 'POST',
    url: 'https://api.dev/users',
    headers: [['Content-Type', 'application/json']],
    body: `{"name":"O'Brien"}`,
}

test('cURL quotes for the shell, including single quotes in the body', () => {
    assert.equal(
        generateSnippet('curl', REQUEST),
        [
            `curl --request POST 'https://api.dev/users' \\`,
            `  --header 'Content-Type: application/json' \\`,
            `  --data '{"name":"O'\\''Brien"}'`,
        ].join('\n'),
    )
})

test('cURL omits headers and data when there are none', () => {
    const snippet = generateSnippet('curl', {
        method: 'GET',
        url: 'https://api.dev',
        headers: [],
        body: null,
    })
    assert.equal(snippet, `curl --request GET 'https://api.dev'`)
})

test('fetch and Python snippets carry the method, URL, headers and body', () => {
    for (const language of ['fetch', 'python'] as const) {
        const snippet = generateSnippet(language, REQUEST)
        assert.match(snippet, /POST/)
        assert.match(snippet, /https:\/\/api\.dev\/users/)
        assert.match(snippet, /"Content-Type": "application\/json"/)
        assert.match(snippet, /O'Brien/)
    }
})

test('every language carries the method, URL, header name and body', () => {
    for (const { id } of SNIPPET_LANGUAGES) {
        const snippet = generateSnippet(id, REQUEST)
        assert.match(snippet, /POST|Post|post/, id)
        assert.match(snippet, /api\.dev/, id)
        assert.match(snippet, /application\/json/, id)
        assert.match(snippet, /Brien/, id)
    }
})

test('Go snippet layout: strings reader, client, header', () => {
    const snippet = generateSnippet('go', REQUEST)
    assert.match(snippet, /payload := strings\.NewReader\(/)
    assert.match(snippet, /req\.Header\.Add\("Content-Type", "application\/json"\)/)
    assert.doesNotMatch(
        generateSnippet('go', {
            ...REQUEST,
            body: null,
        }),
        /strings/,
    )
})

test('Dart escapes $ and PHP escapes quotes', () => {
    const request = {
        ...REQUEST,
        body: `$x 'y'`,
    }
    assert.match(generateSnippet('dart-http', request), /\\\$x/)
    assert.match(generateSnippet('php-curl', request), /\$x \\'y\\'/)
})

test('raw HTTP has the host, the path and the body length', () => {
    assert.equal(
        generateSnippet('http', REQUEST),
        [
            'POST /users HTTP/1.1',
            'Host: api.dev',
            'Content-Type: application/json',
            'Content-Length: 18',
            '',
            `{"name":"O'Brien"}`,
        ].join('\n'),
    )
})
