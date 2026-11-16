/** AWS Signature Version 4, as the `aws4` library computes it. */
import { createHash, createHmac } from 'node:crypto'

import { flagValue, textValue } from '#shared/auth.ts'
import { HEADER } from '#shared/http.ts'
import type { AuthValues } from '#shared/types.ts'

import { type Outgoing, percentEncode, sortedEncodedPairs, withHeader } from './outgoing.ts'

/** Headers proxies and clients change or add, so signing them would break the signature. */
const UNSIGNED_HEADERS = new Set([
    'authorization',
    'connection',
    'x-amzn-trace-id',
    'user-agent',
    'expect',
    'presigned-expires',
    'range',
    'cache-control',
])

const sha256 = (data: string) => createHash('sha256').update(data).digest('hex')
const hmac = (key: string | Buffer, data: string) => createHmac('sha256', key).update(data).digest()

/** `20150830T123600Z`. */
function amzDate(date: Date): string {
    return date.toISOString().replace(/[:-]|\.\d{3}/g, '')
}

/** Each segment encoded; S3 paths once, every other service's twice, as AWS asks. */
function canonicalPath(url: URL, service: string): string {
    return url.pathname
        .split('/')
        .map((segment) =>
            service === 's3' ? percentEncode(decodeURIComponent(segment)) : percentEncode(segment),
        )
        .join('/')
}

function canonicalQuery(params: [string, string][]): string {
    return sortedEncodedPairs(params)
        .map(([key, value]) => `${key}=${value}`)
        .join('&')
}

export function signAwsV4(outgoing: Outgoing, values: AuthValues, now = new Date()): Outgoing {
    const accessKey = textValue(values, 'accessKey')
    const secretKey = textValue(values, 'secretKey')
    const region = textValue(values, 'region', 'us-east-1')
    const service = textValue(values, 'service', 'execute-api')
    const sessionToken = textValue(values, 'sessionToken')
    const inQuery = flagValue(values, 'addAuthDataToQuery')

    const timestamp = amzDate(now)
    const day = timestamp.slice(0, 8)
    const scope = `${day}/${region}/${service}/aws4_request`
    const payloadHash =
        inQuery && service === 's3' ? 'UNSIGNED-PAYLOAD' : sha256(outgoing.body ?? '')

    let signedRequest = outgoing

    if (!inQuery) {
        signedRequest = withHeader(signedRequest, 'X-Amz-Date', timestamp)

        if (sessionToken) {
            signedRequest = withHeader(signedRequest, 'X-Amz-Security-Token', sessionToken)
        }

        if (service === 's3') {
            signedRequest = withHeader(signedRequest, 'X-Amz-Content-Sha256', payloadHash)
        }
    }

    const headers = new Map<string, string>([['host', outgoing.url.host]])

    if (!inQuery) {
        for (const [name, value] of signedRequest.headers) {
            const lower = name.toLowerCase()

            if (!UNSIGNED_HEADERS.has(lower)) {
                headers.set(lower, value.trim().replace(/\s+/g, ' '))
            }
        }
    }

    const names = [...headers.keys()].sort()
    const signedHeaders = names.join(';')

    const url = new URL(outgoing.url)

    if (inQuery) {
        url.searchParams.set('X-Amz-Algorithm', 'AWS4-HMAC-SHA256')
        url.searchParams.set('X-Amz-Credential', `${accessKey}/${scope}`)
        url.searchParams.set('X-Amz-Date', timestamp)
        url.searchParams.set('X-Amz-Expires', '86400')
        url.searchParams.set('X-Amz-SignedHeaders', signedHeaders)

        if (sessionToken) {
            url.searchParams.set('X-Amz-Security-Token', sessionToken)
        }
    }

    const canonicalRequest = [
        outgoing.method.toUpperCase(),
        canonicalPath(url, service),
        canonicalQuery([...url.searchParams]),
        names.map((name) => `${name}:${headers.get(name)}\n`).join(''),
        signedHeaders,
        payloadHash,
    ].join('\n')
    const stringToSign = ['AWS4-HMAC-SHA256', timestamp, scope, sha256(canonicalRequest)].join('\n')
    const signingKey = hmac(
        hmac(hmac(hmac(`AWS4${secretKey}`, day), region), service),
        'aws4_request',
    )
    const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex')

    if (inQuery) {
        url.searchParams.set('X-Amz-Signature', signature)

        return {
            ...signedRequest,
            url,
        }
    }

    return withHeader(
        signedRequest,
        HEADER.authorization,
        `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    )
}
