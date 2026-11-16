import assert from 'node:assert/strict'
import { createHash, createHmac } from 'node:crypto'
import { createServer, type Server } from 'node:http'
import type { AddressInfo, Socket } from 'node:net'
import { after, before, test } from 'node:test'

import { HttpError } from '#server/http/router.ts'

import { parseSendRequest, sendRequest } from './proxy.ts'
import { ntlmV2Hash } from './signing/ntlm.ts'

// Servers that check auth the way real ones do: they challenge, then verify the answer.
let server: Server
let base: string
const SERVER_CHALLENGE = Buffer.from('0123456789abcdef', 'hex')
const socketIds = new WeakMap<Socket, number>()
let nextSocketId = 1
const ntlmChallengedOn = new Set<number>()

function ntlmChallenge(): string {
    const message = Buffer.alloc(48)
    Buffer.from('NTLMSSP\0', 'latin1').copy(message)
    message.writeUInt32LE(2, 8)
    message.writeUInt32LE(0xa2898205, 20)
    SERVER_CHALLENGE.copy(message, 24)
    message.writeUInt32LE(48, 44) // Empty target info at the end.
    return message.toString('base64')
}

/** Checks the NTLMv2 proof in an authenticate message against the known password. */
function ntlmProofIsValid(token: string): boolean {
    const message = Buffer.from(token, 'base64')
    if (message.readUInt32LE(8) !== 3) {
        return false
    }
    const length = message.readUInt16LE(20)
    const offset = message.readUInt32LE(24)
    const nt = message.subarray(offset, offset + length)
    const expected = createHmac('md5', ntlmV2Hash('User', 'Password', 'Domain'))
        .update(Buffer.concat([SERVER_CHALLENGE, nt.subarray(16)]))
        .digest()
    return expected.equals(nt.subarray(0, 16))
}

function digestIsValid(header: string, method: string): boolean {
    const params = Object.fromEntries(
        [...header.matchAll(/(\w+)=(?:"([^"]*)"|([^\s,]+))/g)].map((m) => [m[1], m[2] ?? m[3]]),
    )
    const md5 = (text: string) => createHash('md5').update(text).digest('hex')
    const ha1 = md5(`${params.username}:${params.realm}:Circle Of Life`)
    const ha2 = md5(`${method}:${params.uri}`)
    return (
        params.nonce === 'n0nce' &&
        params.opaque === 'op4que' &&
        params.response ===
            md5(`${ha1}:${params.nonce}:${params.nc}:${params.cnonce}:${params.qop}:${ha2}`)
    )
}

before(async () => {
    server = createServer((req, res) => {
        if (!socketIds.has(req.socket)) {
            socketIds.set(req.socket, nextSocketId++)
        }
        const socket = socketIds.get(req.socket)!
        const authorization = req.headers.authorization ?? ''

        if (req.url === '/digest') {
            if (authorization.startsWith('Digest ') && digestIsValid(authorization, req.method!)) {
                return res.end('digest ok')
            }
            res.writeHead(401, {
                'WWW-Authenticate':
                    'Digest realm="kynova", qop="auth,auth-int", nonce="n0nce", opaque="op4que"',
            }).end('who?')
        } else if (req.url === '/ntlm') {
            const token = authorization.match(/^NTLM (.+)$/)?.[1]
            const type = token ? Buffer.from(token, 'base64').readUInt32LE(8) : 0
            if (type === 1) {
                ntlmChallengedOn.add(socket)
                return res
                    .writeHead(401, { 'WWW-Authenticate': `NTLM ${ntlmChallenge()}` })
                    .end('challenge')
            }
            // NTLM authenticates the connection: the answer must come on the socket that was challenged.
            if (type === 3 && ntlmChallengedOn.has(socket) && ntlmProofIsValid(token!)) {
                return res.end('ntlm ok')
            }
            res.writeHead(401, { 'WWW-Authenticate': 'NTLM' }).end('no')
        } else {
            res.end(
                JSON.stringify({
                    authorization,
                    url: req.url,
                }),
            )
        }
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

after(() => server.close())

const send = (path: string, auth: object, method = 'GET') =>
    sendRequest(
        parseSendRequest({
            method,
            url: base + path,
            headers: [],
            body: null,
            auth,
        }),
    )

test('Digest answers the server’s challenge and gets in', async () => {
    const response = await send('/digest', {
        type: 'digest',
        values: {
            username: 'Mufasa',
            password: 'Circle Of Life',
        },
    })
    assert.equal(response.status, 200)
    assert.equal(response.body, 'digest ok')
})

test('Digest with retrying off returns the challenge as it came', async () => {
    const response = await send('/digest', {
        type: 'digest',
        values: {
            username: 'Mufasa',
            password: 'Circle Of Life',
            disableRetryRequest: true,
        },
    })
    assert.equal(response.status, 401)
})

test('Digest with a wrong password is refused by the server', async () => {
    const response = await send('/digest', {
        type: 'digest',
        values: {
            username: 'Mufasa',
            password: 'wrong',
        },
    })
    assert.equal(response.status, 401)
})

test('NTLM completes the handshake on one connection', async () => {
    const response = await send('/ntlm', {
        type: 'ntlm',
        values: {
            username: 'User',
            password: 'Password',
            domain: 'Domain',
        },
    })
    assert.equal(response.status, 200)
    assert.equal(response.body, 'ntlm ok')
})

test('NTLM with a wrong password is refused by the server', async () => {
    const response = await send('/ntlm', {
        type: 'ntlm',
        values: {
            username: 'User',
            password: 'nope',
            domain: 'Domain',
        },
    })
    assert.equal(response.status, 401)
})

test('signed auth reaches the server as a header or in the URL', async () => {
    const hawk = JSON.parse(
        (
            await send('/echo', {
                type: 'hawk',
                values: {
                    authId: 'id',
                    authKey: 'key',
                },
            })
        ).body,
    )
    assert.match(hawk.authorization, /^Hawk id="id", ts="\d+", nonce="[^"]+", mac="[^"]+"$/)

    const jwt = JSON.parse(
        (
            await send('/echo', {
                type: 'jwt',
                values: {
                    secret: 's',
                    payload: '{}',
                    addTokenTo: 'queryParam',
                    queryParamKey: 't',
                },
            })
        ).body,
    )
    assert.match(jwt.url, /^\/echo\?t=eyJ/)
})

test('a signing problem is reported as a bad request', async () => {
    await assert.rejects(
        send('/echo', {
            type: 'jwt',
            values: { payload: 'not json' },
        }),
        (error: unknown) =>
            error instanceof HttpError &&
            error.status === 400 &&
            /not valid JSON/.test(error.message),
    )
})

test('malformed auth is refused before anything is sent', () => {
    const body = (auth: unknown) => ({
        method: 'GET',
        url: base,
        headers: [],
        body: null,
        auth,
    })
    for (const auth of [
        {
            type: 'oauth2',
            values: {},
        },
        {
            type: 'nope',
            values: {},
        },
        { type: 'hawk' },
        {
            type: 'hawk',
            values: [],
        },
        {
            type: 'hawk',
            values: { a: {} },
        },
        'hawk',
    ]) {
        assert.throws(() => parseSendRequest(body(auth)), HttpError, JSON.stringify(auth))
    }
})
