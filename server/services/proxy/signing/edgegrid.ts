/** Akamai EdgeGrid (EG1-HMAC-SHA256), as Akamai's own client libraries sign. */
import { createHash, createHmac, randomUUID } from 'node:crypto'

import { textValue } from '#shared/auth.ts'
import { HEADER } from '#shared/http.ts'
import type { AuthValues } from '#shared/types.ts'

import { getHeader, type Outgoing, withHeader } from './outgoing.ts'

/** Akamai signs at most this much of a POST body. */
const MAX_BODY = 131072

const hmacBase64 = (key: string, data: string) =>
    createHmac('sha256', key).update(data).digest('base64')

/** `20240101T12:00:00+0000`. */
function edgegridTimestamp(date: Date): string {
    return `${date.toISOString().replace(/-|\.\d{3}Z$/g, '')}+0000`
}

function canonicalHeaders(outgoing: Outgoing, names: string): string {
    return names
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
        .flatMap((name) => {
            const value = getHeader(outgoing, name)

            return value === undefined
                ? []
                : [`${name.toLowerCase()}:${value.trim().replace(/\s+/g, ' ')}`]
        })
        .join('\t')
}

export function edgegridHeader(
    outgoing: Outgoing,
    values: AuthValues,
    now = new Date(),
    nonce = randomUUID(),
): string {
    const timestamp = textValue(values, 'timestamp') || edgegridTimestamp(now)
    const unsigned =
        `EG1-HMAC-SHA256 client_token=${textValue(values, 'clientToken')};access_token=${textValue(values, 'accessToken')};` +
        `timestamp=${timestamp};nonce=${textValue(values, 'nonce') || nonce};`
    const isPost = outgoing.method.toUpperCase() === 'POST'
    const contentHash =
        isPost && outgoing.body
            ? createHash('sha256')
                  .update(Buffer.from(outgoing.body).subarray(0, MAX_BODY))
                  .digest('base64')
            : ''

    const { url } = outgoing
    const dataToSign = [
        outgoing.method.toUpperCase(),
        url.protocol.replace(':', ''),
        url.host,
        url.pathname + url.search,
        canonicalHeaders(outgoing, textValue(values, 'headersToSign')),
        contentHash,
        unsigned,
    ].join('\t')
    const signingKey = hmacBase64(textValue(values, 'clientSecret'), timestamp)

    return `${unsigned}signature=${hmacBase64(signingKey, dataToSign)}`
}

export function signEdgegrid(outgoing: Outgoing, values: AuthValues, now?: Date): Outgoing {
    return withHeader(outgoing, HEADER.authorization, edgegridHeader(outgoing, values, now))
}
