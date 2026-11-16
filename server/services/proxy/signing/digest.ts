/** HTTP Digest authentication (RFC 7616, and RFC 2617 servers without qop). */
import { createHash, randomBytes } from 'node:crypto'

import { textValue } from '#shared/auth.ts'
import { HEADER } from '#shared/http.ts'
import type { AuthValues } from '#shared/types.ts'

import { type Outgoing, quoted, replaceHeader } from './outgoing.ts'

const HASHES: Record<string, string> = {
    MD5: 'md5',
    'SHA-256': 'sha256',
    'SHA-512-256': 'sha512-256',
}

/** What the server's challenge (or the user's own settings) says. */
export interface DigestChallenge {
    realm: string
    nonce: string
    qop?: string
    opaque?: string
    algorithm?: string
}

/** The challenge written in the auth settings, when the user filled in realm and nonce themselves. */
export function challengeFromValues(values: AuthValues): DigestChallenge | null {
    const realm = textValue(values, 'realm')
    const nonce = textValue(values, 'nonce')

    return realm && nonce
        ? {
              realm,
              nonce,
          }
        : null
}

/** Picks the qop to use: the one the user named, else `auth` when offered, else the first offered. */
function chooseQop(asked: string, offered: string | undefined): string | undefined {
    if (asked) {
        return asked
    }

    if (!offered) {
        return undefined
    }

    const options = offered.split(',').map((option) => option.trim())

    return options.includes('auth') ? 'auth' : options[0]
}

/** The `Authorization: Digest …` header value for a request. Settings the user filled in win over the challenge. */
export function digestHeader(
    outgoing: Outgoing,
    values: AuthValues,
    challenge: DigestChallenge,
    clientNonce = randomBytes(8).toString('hex'),
): string {
    const algorithm = textValue(values, 'algorithm') || challenge.algorithm || 'MD5'
    const isSession = algorithm.toUpperCase().endsWith('-SESS')
    const hashName = HASHES[algorithm.toUpperCase().replace(/-SESS$/, '')] ?? 'md5'
    const hash = (text: string) => createHash(hashName).update(text).digest('hex')

    const username = textValue(values, 'username')
    const realm = textValue(values, 'realm') || challenge.realm
    const nonce = textValue(values, 'nonce') || challenge.nonce
    const opaque = textValue(values, 'opaque') || challenge.opaque
    const qop = chooseQop(textValue(values, 'qop'), challenge.qop)
    const nonceCount = textValue(values, 'nonceCount') || '00000001'
    const cnonce = textValue(values, 'clientNonce') || clientNonce
    const uri = outgoing.url.pathname + outgoing.url.search

    let ha1 = hash(`${username}:${realm}:${textValue(values, 'password')}`)

    if (isSession) {
        ha1 = hash(`${ha1}:${nonce}:${cnonce}`)
    }

    const ha2 =
        qop === 'auth-int'
            ? hash(`${outgoing.method}:${uri}:${hash(outgoing.body ?? '')}`)
            : hash(`${outgoing.method}:${uri}`)
    const response = qop
        ? hash(`${ha1}:${nonce}:${nonceCount}:${cnonce}:${qop}:${ha2}`)
        : hash(`${ha1}:${nonce}:${ha2}`)

    const parts = [
        `username=${quoted(username)}`,
        `realm=${quoted(realm)}`,
        `nonce=${quoted(nonce)}`,
        `uri=${quoted(uri)}`,
        `algorithm=${algorithm}`,
        ...(qop ? [`qop=${qop}`, `nc=${nonceCount}`, `cnonce=${quoted(cnonce)}`] : []),
        `response=${quoted(response)}`,
        ...(opaque ? [`opaque=${quoted(opaque)}`] : []),
    ]

    return `Digest ${parts.join(', ')}`
}

export function signDigest(
    outgoing: Outgoing,
    values: AuthValues,
    challenge: DigestChallenge,
): Outgoing {
    return replaceHeader(outgoing, HEADER.authorization, digestHeader(outgoing, values, challenge))
}
