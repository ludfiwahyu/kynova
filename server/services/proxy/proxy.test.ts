import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { after, before, test } from 'node:test'

import { HttpError } from '#server/http/router.ts'

import { parseSendRequest, sendRequest } from './proxy.ts'

// The server binds to loopback in tests, so private targets such as this one are allowed.
let server: Server
let base: string

before(async () => {
    server = createServer((req, res) => {
        if (req.url === '/slow') {
            setTimeout(() => res.end('late'), 1500)
        } else if (req.url === '/big') {
            res.end('x'.repeat(3 * 1024 * 1024))
        } else if (req.url === '/chunked') {
            // Written in pieces, so Node sends it chunked, without a Content-Length.
            res.write('a'.repeat(64 * 1024))
            setTimeout(() => res.end('b'.repeat(64 * 1024)), 20)
        } else if (req.url === '/sized') {
            const body = 'y'.repeat(256 * 1024)
            res.writeHead(200, { 'Content-Length': String(body.length) }).end(body)
        } else if (req.url === '/redirect') {
            res.writeHead(302, { Location: '/echo' }).end()
        } else {
            res.end(
                JSON.stringify({
                    method: req.method,
                    headers: req.headers,
                }),
            )
        }
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

after(() => server.close())

const get = (path: string, options?: object) =>
    ({
        method: 'GET',
        url: base + path,
        headers: [],
        body: null,
        options,
    }) as never

test('a timeout from Settings ends a slow request with a clear message', async () => {
    await assert.rejects(
        sendRequest(get('/slow', { timeoutMs: 300 })),
        (error: unknown) =>
            error instanceof HttpError &&
            error.status === 504 &&
            error.message === 'No response within 0.3 seconds.',
    )
})

test('the response size limit cuts the body off and reports the limit', async () => {
    const response = await sendRequest(get('/big', { maxResponseBytes: 1024 * 1024 }))
    assert.equal(response.truncated, true)
    assert.equal(response.sizeBytes, 1024 * 1024)
    assert.equal(response.limitBytes, 1024 * 1024)
})

test('the size limit never goes above the server limit', async () => {
    const response = await sendRequest(get('/echo', { maxResponseBytes: 1024 ** 4 }))
    assert.equal(response.limitBytes, 10 * 1024 * 1024)
})

test('redirects are followed unless Settings turn that off', async () => {
    assert.equal((await sendRequest(get('/redirect'))).status, 200)
    assert.equal((await sendRequest(get('/redirect', { followRedirects: false }))).status, 302)
})

test('a custom method reaches the server', async () => {
    const response = await sendRequest({
        method: 'PROPFIND',
        url: `${base}/echo`,
        headers: [],
        body: null,
    })
    assert.equal(JSON.parse(response.body).method, 'PROPFIND')
})

test('malformed send options are refused', () => {
    const body = (options: unknown) => ({
        method: 'GET',
        url: base,
        headers: [],
        body: null,
        options,
    })
    for (const options of [
        { timeoutMs: -1 },
        { maxResponseBytes: 'big' },
        { followRedirects: 'yes' },
        'fast',
        [1],
    ]) {
        assert.throws(() => parseSendRequest(body(options)), HttpError, JSON.stringify(options))
    }
    assert.deepEqual(parseSendRequest(body({ timeoutMs: 0 })).options, {
        timeoutMs: 0,
        maxResponseBytes: undefined,
        followRedirects: undefined,
    })
})

test('progress counts the body as it arrives, out of its Content-Length', async () => {
    const seen: {
        received: number
        total: number | null
    }[] = []
    const response = await sendRequest(get('/sized'), (progress) => seen.push(progress))

    assert.deepEqual(seen[0], {
        received: 0,
        total: 256 * 1024,
    })
    assert.deepEqual(seen.at(-1), {
        received: 256 * 1024,
        total: 256 * 1024,
    })
    assert.ok(seen.every((each, i) => i === 0 || each.received >= seen[i - 1].received))
    assert.equal(response.sizeBytes, 256 * 1024)
})

test('without a Content-Length the total is unknown', async () => {
    const seen: {
        received: number
        total: number | null
    }[] = []
    await sendRequest(get('/chunked'), (progress) => seen.push(progress))
    assert.ok(seen.length > 1 && seen.every(({ total }) => total === null))
})
