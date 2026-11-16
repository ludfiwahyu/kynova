/** OAuth 1.0a request signing (RFC 5849). */
import { createHash, createHmac, randomBytes, sign } from 'node:crypto'

import { HttpError } from '#server/http/router.ts'
import { flagValue, textValue } from '#shared/auth.ts'
import { HEADER, STATUS } from '#shared/http.ts'
import type { AuthValues } from '#shared/types.ts'

import {
    isFormBody,
    type Outgoing,
    percentEncode,
    quoted,
    sortedEncodedPairs,
    withHeader,
} from './outgoing.ts'

export const OAUTH1_SIGNATURE_METHODS = [
    'HMAC-SHA1',
    'HMAC-SHA256',
    'HMAC-SHA512',
    'RSA-SHA1',
    'RSA-SHA256',
    'RSA-SHA512',
    'PLAINTEXT',
]

const DIGESTS: Record<string, string> = {
    SHA1: 'sha1',
    SHA256: 'sha256',
    SHA512: 'sha512',
}

/** Section 3.4.1.3: every parameter, encoded, sorted by name then value. */
function normalizedParameters(pairs: [string, string][]): string {
    return sortedEncodedPairs(pairs)
        .map(([key, value]) => `${key}=${value}`)
        .join('&')
}

/** Section 3.4.1.2: scheme and host in lowercase, the port only when it is not the default. */
function baseStringUri(url: URL): string {
    return `${url.protocol}//${url.host.toLowerCase()}${url.pathname}`
}

export function signatureBaseString(method: string, url: URL, pairs: [string, string][]): string {
    return [
        method.toUpperCase(),
        percentEncode(baseStringUri(url)),
        percentEncode(normalizedParameters(pairs)),
    ].join('&')
}

/**
 * The oauth_* parameters with their signature. Query parameters and a form
 * body are signed too, as the RFC requires.
 */
export function oauth1Parameters(
    outgoing: Outgoing,
    values: AuthValues,
    now = Date.now(),
    nonce = randomBytes(8).toString('hex'),
): [string, string][] {
    const method = textValue(values, 'signatureMethod', 'HMAC-SHA1').toUpperCase()

    if (!OAUTH1_SIGNATURE_METHODS.includes(method)) {
        throw new HttpError(STATUS.badRequest, `${method} is not an OAuth 1.0 signature method.`)
    }

    const oauth: [string, string][] = [
        ['oauth_consumer_key', textValue(values, 'consumerKey')],
        ['oauth_token', textValue(values, 'token')],
        ['oauth_signature_method', method],
        ['oauth_timestamp', textValue(values, 'timestamp') || String(Math.floor(now / 1000))],
        ['oauth_nonce', textValue(values, 'nonce') || nonce],
        ['oauth_version', textValue(values, 'version', '1.0')],
        ['oauth_callback', textValue(values, 'callback')],
        ['oauth_verifier', textValue(values, 'verifier')],
    ]

    if (flagValue(values, 'includeBodyHash') && outgoing.body !== null && !isFormBody(outgoing)) {
        const digest = DIGESTS[method.split('-')[1]] ?? 'sha1'

        oauth.push(['oauth_body_hash', createHash(digest).update(outgoing.body).digest('base64')])
    }

    const included = flagValue(values, 'addEmptyParamsToSign')
        ? oauth
        : oauth.filter(([, value]) => value !== '')

    const signed: [string, string][] = [...outgoing.url.searchParams, ...included]

    if (isFormBody(outgoing)) {
        signed.push(...new URLSearchParams(outgoing.body!))
    }

    const baseString = signatureBaseString(outgoing.method, outgoing.url, signed)
    const key = `${percentEncode(textValue(values, 'consumerSecret'))}&${percentEncode(textValue(values, 'tokenSecret'))}`

    let signature: string

    if (method === 'PLAINTEXT') {
        signature = key
    } else if (method.startsWith('HMAC')) {
        signature = createHmac(DIGESTS[method.slice(5)], key).update(baseString).digest('base64')
    } else {
        try {
            signature = sign(
                DIGESTS[method.slice(4)],
                Buffer.from(baseString),
                textValue(values, 'privateKey'),
            ).toString('base64')
        } catch {
            throw new HttpError(
                STATUS.badRequest,
                'The private key could not sign the request. Paste an RSA key in PEM format.',
            )
        }
    }

    return [...included, ['oauth_signature', signature]]
}

/**
 * Adds the OAuth parameters: to the Authorization header, or else to a form
 * body when there is one, or the query string otherwise.
 */
export function signOauth1(outgoing: Outgoing, values: AuthValues, now?: number): Outgoing {
    const parameters = oauth1Parameters(outgoing, values, now)

    if (flagValue(values, 'addParamsToHeader', true)) {
        const encode = flagValue(values, 'disableHeaderEncoding')
            ? (text: string) => text
            : percentEncode
        const realm = textValue(values, 'realm')
        const parts = [
            ...(realm ? [`realm=${quoted(realm)}`] : []),
            ...parameters.map(([key, value]) => `${key}="${encode(value)}"`),
        ]

        return withHeader(outgoing, HEADER.authorization, `OAuth ${parts.join(',')}`)
    }

    const encoded = parameters
        .map(([key, value]) => `${percentEncode(key)}=${percentEncode(value)}`)
        .join('&')

    if (isFormBody(outgoing)) {
        return {
            ...outgoing,
            body: outgoing.body ? `${outgoing.body}&${encoded}` : encoded,
        }
    }

    const url = new URL(outgoing.url)

    url.search = url.search ? `${url.search}&${encoded}` : `?${encoded}`

    return {
        ...outgoing,
        url,
    }
}
