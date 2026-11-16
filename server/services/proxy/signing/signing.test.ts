import assert from 'node:assert/strict'
import { generateKeyPairSync, verify } from 'node:crypto'
import { test } from 'node:test'

import { signAwsV4 } from './awsv4.ts'
import { digestHeader } from './digest.ts'
import { edgegridHeader } from './edgegrid.ts'
import { hawkHeader } from './hawk.ts'
import { digestRetry, ntlmAuthenticate, signRequest } from './index.ts'
import { signAsap, signJwt, signJwtBearer } from './jwt.ts'
import { md4 } from './md4.ts'
import { authenticateMessage, ntlmV2Hash, ntlmV2Responses, parseChallengeMessage } from './ntlm.ts'
import { oauth1Parameters, signOauth1 } from './oauth1.ts'
import type { Outgoing } from './outgoing.ts'

const request = (
    method: string,
    url: string,
    headers: [string, string][] = [],
    body: string | null = null,
): Outgoing => ({
    method,
    url: new URL(url),
    headers,
    body,
})
const header = (outgoing: Outgoing, name: string) =>
    outgoing.headers.find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1]
const decodePart = (token: string, index: number) =>
    JSON.parse(Buffer.from(token.split('.')[index], 'base64url').toString())

test('MD4 matches RFC 1320', () => {
    assert.equal(md4(Buffer.from('')).toString('hex'), '31d6cfe0d16ae931b73c59d7e0c089c0')
    assert.equal(md4(Buffer.from('abc')).toString('hex'), 'a448017aaf21d8525fc10ae87aa6729d')
    assert.equal(
        md4(Buffer.from('1234567890'.repeat(8))).toString('hex'),
        'e33b4ddc9c38f2199c3e7b164fcc0536',
    )
})

test('NTLMv2 matches the MS-NLMP worked example', () => {
    const hash = ntlmV2Hash('User', 'Password', 'Domain')
    assert.equal(hash.toString('hex'), '0c868a403bfd7a93a3001ef22ef02e3f')

    const utf16 = (text: string) => Buffer.from(text, 'utf16le')
    const pair = (id: number, value: Buffer) =>
        Buffer.concat([Buffer.from([id, 0, value.length, 0]), value])
    const targetInfo = Buffer.concat([
        pair(2, utf16('Domain')),
        pair(1, utf16('Server')),
        Buffer.alloc(4),
    ])
    const challenge = {
        serverChallenge: Buffer.from('0123456789abcdef', 'hex'),
        targetInfo,
        flags: 0xe28a8233,
    }
    const { ntResponse, lmResponse } = ntlmV2Responses(hash, challenge, Buffer.alloc(8, 0xaa), 0n)

    assert.equal(ntResponse.subarray(0, 16).toString('hex'), '68cd0ab851e51c96aabc927bebef6a1c')
    assert.equal(lmResponse.toString('hex'), '86c35097ac9cec102554764a57cccc19aaaaaaaaaaaaaaaa')
})

test('NTLM reads a challenge and answers it with a well-formed message', () => {
    const challengeMessage = Buffer.alloc(56)
    Buffer.from('NTLMSSP\0', 'latin1').copy(challengeMessage)
    challengeMessage.writeUInt32LE(2, 8)
    challengeMessage.writeUInt32LE(0xa2898205, 20)
    Buffer.from('0123456789abcdef', 'hex').copy(challengeMessage, 24)
    challengeMessage.writeUInt16LE(4, 40)
    challengeMessage.writeUInt32LE(48, 44)
    const parsed = parseChallengeMessage(`NTLM ${challengeMessage.toString('base64')}`)!
    assert.equal(parsed.serverChallenge.toString('hex'), '0123456789abcdef')
    assert.equal(parsed.targetInfo.length, 4)
    assert.equal(parseChallengeMessage('Basic realm="x"'), null)

    const message = Buffer.from(
        authenticateMessage(
            {
                username: 'User',
                password: 'Password',
                domain: 'Domain',
                workstation: 'PC',
            },
            parsed,
        ),
        'base64',
    )
    assert.equal(message.subarray(0, 8).toString('latin1'), 'NTLMSSP\0')
    assert.equal(message.readUInt32LE(8), 3)
    const userLength = message.readUInt16LE(36)
    const userOffset = message.readUInt32LE(40)
    assert.equal(message.subarray(userOffset, userOffset + userLength).toString('utf16le'), 'User')

    const leg = {
        status: 401,
        authenticate: `NTLM ${challengeMessage.toString('base64')}`,
        discard: async () => {},
    }
    const auth = {
        type: 'ntlm' as const,
        values: {
            username: 'User',
            password: 'Password',
        },
    }
    assert.match(
        header(ntlmAuthenticate(request('GET', 'http://intranet/'), auth, leg)!, 'authorization')!,
        /^NTLM TlRMTVNTUAADAAAA/,
    )
    assert.equal(
        ntlmAuthenticate(request('GET', 'http://intranet/'), auth, {
            ...leg,
            status: 200,
        }),
        null,
    )
})

test('Digest matches the RFC 2617 example', () => {
    const value = digestHeader(
        request('GET', 'http://www.nowhere.org/dir/index.html'),
        {
            username: 'Mufasa',
            password: 'Circle Of Life',
            nonceCount: '00000001',
        },
        {
            realm: 'testrealm@host.com',
            nonce: 'dcd98b7102dd2f0e8b11d0f600bfb0c093',
            qop: 'auth,auth-int',
            opaque: '5ccc069c403ebaf9f0171e9517f40e41',
        },
        '0a4f113b',
    )
    assert.match(value, /response="6629fae49393a05397450978507c4ef1"/)
    assert.match(value, /qop=auth, nc=00000001, cnonce="0a4f113b"/)
    assert.match(value, /opaque="5ccc069c403ebaf9f0171e9517f40e41"/)
})

test('Digest answers a 401 challenge once, unless retrying is off', () => {
    const auth = {
        type: 'digest' as const,
        values: {
            username: 'u',
            password: 'p',
        },
    }
    const leg = {
        status: 401,
        authenticate: 'Digest realm="r", nonce="n", qop="auth", algorithm=SHA-256',
        discard: async () => {},
    }
    const outgoing = signRequest(request('GET', 'http://example.com/a'), auth)
    assert.equal(header(outgoing, 'authorization'), undefined, 'no answer before the challenge')

    const retry = digestRetry(outgoing, auth, leg)!
    assert.match(
        header(retry, 'authorization')!,
        /^Digest username="u", realm="r", nonce="n", uri="\/a", algorithm=SHA-256, qop=auth/,
    )
    assert.equal(
        digestRetry(
            outgoing,
            {
                ...auth,
                values: {
                    ...auth.values,
                    disableRetryRequest: true,
                },
            },
            leg,
        ),
        null,
    )
    assert.equal(
        digestRetry(outgoing, auth, {
            ...leg,
            authenticate: 'Basic realm="r"',
        }),
        null,
    )
    assert.equal(
        digestRetry(outgoing, auth, {
            ...leg,
            status: 200,
        }),
        null,
    )
})

test('Hawk matches the example in the Hawk documentation', () => {
    const value = hawkHeader(request('GET', 'http://example.com:8000/resource/1?b=1&a=2'), {
        authId: 'dh37fgj492je',
        authKey: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
        algorithm: 'sha256',
        timestamp: '1353832234',
        nonce: 'j4h3g2',
        extraData: 'some-app-ext-data',
    })
    assert.equal(
        value,
        'Hawk id="dh37fgj492je", ts="1353832234", nonce="j4h3g2", ext="some-app-ext-data", mac="6R4rV5iE+NPoym+WwjeHzjAGXUtLNIxmo1vpMofpLAE="',
    )
})

test('AWS Signature V4 matches the IAM example in the AWS documentation', () => {
    const signed = signAwsV4(
        request('GET', 'https://iam.amazonaws.com/?Action=ListUsers&Version=2010-05-08', [
            ['Content-Type', 'application/x-www-form-urlencoded; charset=utf-8'],
        ]),
        {
            accessKey: 'AKIDEXAMPLE',
            secretKey: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
            region: 'us-east-1',
            service: 'iam',
        },
        new Date('2015-08-30T12:36:00Z'),
    )
    assert.equal(header(signed, 'x-amz-date'), '20150830T123600Z')
    assert.equal(
        header(signed, 'authorization'),
        'AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20150830/us-east-1/iam/aws4_request, SignedHeaders=content-type;host;x-amz-date, Signature=5d672d79c15b13162d9279b0855cfba6789a8edb4c82c400e06b5924a6f2b5d7',
    )
})

test('AWS Signature V4 can go in the query string', () => {
    const signed = signAwsV4(
        request('GET', 'https://bucket.s3.amazonaws.com/a.txt'),
        {
            accessKey: 'AK',
            secretKey: 'SK',
            region: 'eu-west-1',
            service: 's3',
            addAuthDataToQuery: true,
        },
        new Date('2024-01-01T00:00:00Z'),
    )
    const params = signed.url.searchParams
    assert.equal(params.get('X-Amz-Credential'), 'AK/20240101/eu-west-1/s3/aws4_request')
    assert.equal(params.get('X-Amz-SignedHeaders'), 'host')
    assert.match(params.get('X-Amz-Signature')!, /^[0-9a-f]{64}$/)
    assert.equal(header(signed, 'authorization'), undefined)
})

test('OAuth 1.0 matches the signed request in Twitter’s documentation', () => {
    const outgoing = request(
        'POST',
        'https://api.twitter.com/1.1/statuses/update.json?include_entities=true',
        [['Content-Type', 'application/x-www-form-urlencoded']],
        'status=Hello%20Ladies%20%2B%20Gentlemen%2C%20a%20signed%20OAuth%20request%21',
    )
    const values = {
        consumerKey: 'xvz1evFS4wEEPTGEFPHBog',
        consumerSecret: 'kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw',
        token: '370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb',
        tokenSecret: 'LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE',
        timestamp: '1318622958',
        nonce: 'kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg',
    }
    assert.equal(
        Object.fromEntries(oauth1Parameters(outgoing, values)).oauth_signature,
        'hCtSmYh+iHYCEqBWrE7C7hYmtUk=',
    )

    const inHeader = header(signOauth1(outgoing, values), 'authorization')!
    assert.match(inHeader, /^OAuth oauth_consumer_key="xvz1evFS4wEEPTGEFPHBog",/)
    assert.match(inHeader, /oauth_signature="hCtSmYh%2BiHYCEqBWrE7C7hYmtUk%3D"/)

    const inBody = signOauth1(outgoing, {
        ...values,
        addParamsToHeader: false,
    })
    assert.match(inBody.body!, /&oauth_signature=hCtSmYh%2BiHYCEqBWrE7C7hYmtUk%3D/)
    const inUrl = signOauth1(request('GET', 'https://api.example.com/x?a=1'), {
        ...values,
        addParamsToHeader: false,
    })
    assert.equal(inUrl.url.searchParams.get('a'), '1')
    assert.ok(inUrl.url.searchParams.get('oauth_signature'))
})

test('EdgeGrid signs as Akamai’s client library does', () => {
    const value = edgegridHeader(
        request(
            'POST',
            'https://akab-host.luna.akamaiapis.net/billing/v1/items?x=1',
            [],
            '{"a":1}',
        ),
        {
            clientToken: 'client-token-1',
            clientSecret: 'client-secret-1',
            accessToken: 'access-token-1',
            timestamp: '20240101T12:00:00+0000',
            nonce: 'nonce-xyz',
        },
    )
    assert.equal(
        value,
        'EG1-HMAC-SHA256 client_token=client-token-1;access_token=access-token-1;timestamp=20240101T12:00:00+0000;nonce=nonce-xyz;signature=bufV9xRhBW8dOGnpPABnj1g3Fs3x8SAu7gm2pfOP71c=',
    )
})

test('JWT Bearer signs with a secret or a private key, into a header or the query', () => {
    const hs = signJwt('HS256', { typ: 'JWT' }, { sub: '1' }, 'secret')
    assert.deepEqual(decodePart(hs, 0), {
        typ: 'JWT',
        alg: 'HS256',
    })

    const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' })
    const es = signJwt(
        'ES256',
        {},
        { sub: '1' },
        privateKey.export({
            type: 'pkcs8',
            format: 'pem',
        }),
    )
    const [head, body, signature] = es.split('.')
    assert.ok(
        verify(
            'sha256',
            Buffer.from(`${head}.${body}`),
            {
                key: publicKey,
                dsaEncoding: 'ieee-p1363',
            },
            Buffer.from(signature, 'base64url'),
        ),
    )

    const values = {
        algorithm: 'HS256',
        secret: 'c2VjcmV0',
        isSecretBase64Encoded: true,
        payload: '{"sub":"1"}',
        headerPrefix: 'JWT',
    }
    const inHeader = header(
        signJwtBearer(request('GET', 'https://api.example.com/'), values),
        'authorization',
    )!
    assert.equal(inHeader, `JWT ${hs}`, 'a Base64 secret decodes to the same key')

    const inQuery = signJwtBearer(request('GET', 'https://api.example.com/'), {
        ...values,
        addTokenTo: 'queryParam',
        queryParamKey: 'jwt',
    })
    assert.equal(inQuery.url.searchParams.get('jwt'), hs)

    assert.throws(
        () =>
            signJwtBearer(request('GET', 'https://a.example/'), {
                ...values,
                payload: '[1]',
            }),
        /must be a JSON object/,
    )
    assert.throws(
        () =>
            signJwtBearer(request('GET', 'https://a.example/'), {
                algorithm: 'RS256',
                privateKey: 'not a key',
                payload: '{}',
            }),
        /PEM key/,
    )
})

test('ASAP sends a short-lived token with the standard claims', () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const now = Date.UTC(2024, 0, 1)
    const signed = signAsap(
        request('GET', 'https://api.example.com/'),
        {
            alg: 'RS256',
            iss: 'my-service',
            aud: 'their-service',
            kid: 'my-service/key-1',
            privateKey: privateKey.export({
                type: 'pkcs8',
                format: 'pem',
            }) as string,
            exp: '30m',
            claims: '{"scope":"read"}',
        },
        now,
    )
    const token = header(signed, 'authorization')!.replace('Bearer ', '')
    assert.deepEqual(decodePart(token, 0), {
        typ: 'JWT',
        kid: 'my-service/key-1',
        alg: 'RS256',
    })
    const claims = decodePart(token, 1)
    assert.equal(claims.iss, 'my-service')
    assert.equal(claims.sub, 'my-service')
    assert.equal(claims.exp - claims.iat, 1800)
    assert.equal(claims.scope, 'read')
})

test('A header the user set wins over signed auth', () => {
    const signed = signRequest(
        request('GET', 'https://api.example.com/', [['Authorization', 'Mine']]),
        {
            type: 'hawk',
            values: {
                authId: 'a',
                authKey: 'k',
            },
        },
    )
    assert.deepEqual(signed.headers, [['Authorization', 'Mine']])
})
