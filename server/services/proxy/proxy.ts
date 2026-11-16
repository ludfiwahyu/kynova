import { lookup, type LookupAddress } from 'node:dns'
import { BlockList, isIP, type LookupFunction } from 'node:net'

import { Agent, Client, type Dispatcher, fetch, type Response } from 'undici'

import { config } from '#server/config.ts'
import { HttpError } from '#server/http/router.ts'
import { flagValue, isSignedAuthType } from '#shared/auth.ts'
import { MIME, STATUS } from '#shared/http.ts'
import { isHttpMethod } from '#shared/methods.ts'
import type { SendAuth, SendOptions, SendRequest, SendResponse } from '#shared/types.ts'

import {
    digestRetry,
    type Leg,
    ntlmAuthenticate,
    ntlmNegotiate,
    type Outgoing,
    signRequest,
} from './signing/index.ts'

const BODYLESS_METHODS = ['GET', 'HEAD']
const TEXT_CONTENT = /^text\/|json|xml|javascript|html|x-www-form-urlencoded|graphql/i

/**
 * Loopback, private, link-local, reserved and multicast ranges: everything not on the public internet.
 * IPv4-mapped IPv6 addresses (::ffff:127.0.0.1) need no rule of their own: BlockList checks them
 * against the IPv4 rules. A ::ffff:0:0/96 rule would instead match every IPv4 address.
 */
const privateRanges = new BlockList()

for (const [address, prefix] of [
    ['0.0.0.0', 8],
    ['10.0.0.0', 8],
    ['100.64.0.0', 10],
    ['127.0.0.0', 8],
    ['169.254.0.0', 16],
    ['172.16.0.0', 12],
    ['192.0.0.0', 24],
    ['192.168.0.0', 16],
    ['198.18.0.0', 15],
    ['224.0.0.0', 4], // Multicast, then reserved up to 255.255.255.255.
    ['240.0.0.0', 4],
] as const) {
    privateRanges.addSubnet(address, prefix, 'ipv4')
}

for (const [address, prefix] of [
    ['::', 127], // :: and ::1
    ['64:ff9b::', 96], // NAT64, which wraps IPv4 addresses
    ['fc00::', 7],
    ['fe80::', 10],
    ['ff00::', 8],
] as const) {
    privateRanges.addSubnet(address, prefix, 'ipv6')
}

const PRIVATE_TARGET = 'This server does not send requests to private network addresses.'

export function isPrivateAddress(address: string): boolean {
    const family = isIP(address)

    return family !== 0 && privateRanges.check(address, family === 6 ? 'ipv6' : 'ipv4')
}

/**
 * A DNS lookup that refuses names resolving to a private address. It runs when
 * each connection opens, so a name cannot pass a check and then resolve to a
 * different address for the real request (DNS rebinding).
 */
const publicOnlyLookup = ((hostname, options, callback) => {
    lookup(
        hostname,
        {
            ...options,
            all: true,
        },
        (error, addresses: LookupAddress[]) => {
            if (error) {
                return callback(error, '', 0)
            }

            if (addresses.some(({ address }) => isPrivateAddress(address))) {
                return callback(new HttpError(STATUS.forbidden, PRIVATE_TARGET), '', 0)
            }

            if (options.all) {
                return (callback as (error: null, addresses: LookupAddress[]) => void)(
                    null,
                    addresses,
                )
            }

            callback(null, addresses[0].address, addresses[0].family)
        },
    )
}) as LookupFunction

const publicOnlyAgent = new Agent({ connect: { lookup: publicOnlyLookup } })

/** Validates untrusted JSON into a `SendRequest`. */
/** Reads the optional send settings; anything malformed is refused rather than guessed. */
function parseOptions(value: unknown): SendOptions | undefined {
    if (value === undefined) {
        return undefined
    }

    const options = value as Record<string, unknown>
    const isLimit = (field: unknown) =>
        field === undefined || (typeof field === 'number' && Number.isFinite(field) && field >= 0)

    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new HttpError(STATUS.badRequest, 'Send options must be an object.')
    }

    if (!isLimit(options.timeoutMs) || !isLimit(options.maxResponseBytes)) {
        throw new HttpError(
            STATUS.badRequest,
            'Timeout and size limit must be numbers of 0 or more.',
        )
    }

    if (options.followRedirects !== undefined && typeof options.followRedirects !== 'boolean') {
        throw new HttpError(STATUS.badRequest, 'followRedirects must be true or false.')
    }

    return {
        timeoutMs: options.timeoutMs as number | undefined,
        maxResponseBytes: options.maxResponseBytes as number | undefined,
        followRedirects: options.followRedirects as boolean | undefined,
    }
}

/** Reads the auth to sign with: a known type and a flat object of short settings. */
function parseAuth(value: unknown): SendAuth | undefined {
    if (value === undefined) {
        return undefined
    }

    const auth = value as Record<string, unknown>

    if (typeof value !== 'object' || value === null || !isSignedAuthType(auth.type)) {
        throw new HttpError(STATUS.badRequest, 'That auth type cannot be signed.')
    }

    const values = auth.values as Record<string, unknown>
    const isSetting = (setting: unknown) =>
        typeof setting === 'boolean' ||
        typeof setting === 'number' ||
        (typeof setting === 'string' && setting.length <= 65_536)

    if (
        typeof values !== 'object' ||
        values === null ||
        Array.isArray(values) ||
        !Object.values(values).every(isSetting)
    ) {
        throw new HttpError(
            STATUS.badRequest,
            'Auth settings must be text, numbers or true and false.',
        )
    }

    return {
        type: auth.type,
        values,
    } as SendAuth
}

export function parseSendRequest(body: Record<string, unknown>): SendRequest {
    const { method, url, headers, body: payload } = body

    const isHeaderList =
        Array.isArray(headers) &&
        headers.every(
            (h) =>
                Array.isArray(h) && h.length === 2 && h.every((part) => typeof part === 'string'),
        )

    if (!isHttpMethod(method)) {
        throw new HttpError(STATUS.badRequest, 'That HTTP method cannot be sent.')
    }

    if (typeof url !== 'string') {
        throw new HttpError(STATUS.badRequest, 'A URL is required.')
    }

    if (!isHeaderList) {
        throw new HttpError(STATUS.badRequest, 'Headers must be a list of name and value pairs.')
    }

    if (payload !== null && typeof payload !== 'string') {
        throw new HttpError(STATUS.badRequest, 'Body must be text or null.')
    }

    return {
        method,
        url,
        headers,
        body: payload,
        options: parseOptions(body.options),
        auth: parseAuth(body.auth),
    } as SendRequest
}

function parseTarget(rawUrl: string): URL {
    let url: URL

    try {
        url = new URL(rawUrl)
    } catch {
        throw new HttpError(
            STATUS.badRequest,
            'That URL is not valid. Include the protocol, like https://example.com.',
        )
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new HttpError(STATUS.badRequest, 'Only http and https URLs can be sent.')
    }

    return url
}

/** Names are checked when connecting; an address written in the URL never goes through DNS, so it is checked here. */
function assertPublicAddress(url: URL): void {
    const hostname = url.hostname.replace(/^\[|\]$/g, '') // Strip IPv6 brackets.

    if (isPrivateAddress(hostname)) {
        throw new HttpError(STATUS.forbidden, PRIVATE_TARGET)
    }
}

/** How much of a response body has arrived, and its size when the server said it. */
export interface SendProgress {
    received: number
    /** From Content-Length; null when the server did not say (or compressed it). */
    total: number | null
}

/** Reads the body up to `limit` bytes, then stops downloading. Reports each chunk to `onChunk`. */
async function readBody(
    response: Response,
    limit: number,
    onChunk?: (received: number) => void,
): Promise<{
    bytes: Buffer
    truncated: boolean
}> {
    const chunks: Uint8Array[] = []
    let size = 0

    if (!response.body) {
        return {
            bytes: Buffer.alloc(0),
            truncated: false,
        }
    }

    const reader = response.body.getReader()

    for (;;) {
        const { done, value } = await reader.read()

        if (done) {
            return {
                bytes: Buffer.concat(chunks),
                truncated: false,
            }
        }

        const room = limit - size

        if (value.length > room) {
            chunks.push(value.subarray(0, room))
            await reader.cancel()

            return {
                bytes: Buffer.concat(chunks),
                truncated: true,
            }
        }

        chunks.push(value)
        size += value.length
        onChunk?.(size)
    }
}

function describeFailure(error: unknown, timeoutMs: number): HttpError {
    if (error instanceof HttpError) {
        return error
    }

    if (error instanceof Error && error.cause instanceof HttpError) {
        return error.cause
    }

    if (error instanceof Error && error.name === 'TimeoutError') {
        return new HttpError(
            STATUS.gatewayTimeout,
            `No response within ${timeoutMs / 1000} seconds.`,
        )
    }

    // fetch() reports "fetch failed" and keeps the real reason (ECONNREFUSED, ENOTFOUND…) in `cause`.
    const cause =
        error instanceof Error
            ? ((error.cause as Error | undefined)?.message ?? error.message)
            : String(error)

    return new HttpError(STATUS.badGateway, `Could not get a response: ${cause}`)
}

/** The sender's settings, within the server's limits. */
function effectiveLimits(options: SendOptions | undefined) {
    const asked = (value: number | undefined) => (value && value > 0 ? value : undefined)
    const timeoutMs = Math.min(
        asked(options?.timeoutMs) ?? config.sendTimeoutMs,
        config.maxSendTimeoutMs,
    )
    const maxBytes = Math.min(
        asked(options?.maxResponseBytes) ?? config.maxResponseBytes,
        config.maxResponseBytes,
    )
    // A redirect to an address in the URL would skip the DNS check, so where private addresses
    // are blocked, redirects are returned, not followed, whatever the settings say.
    const follow = config.allowPrivateTargets && options?.followRedirects !== false

    return {
        timeoutMs,
        maxBytes,
        redirect: follow ? ('follow' as const) : ('manual' as const),
    }
}

/** What a challenge needs from a response: its status and `WWW-Authenticate` header. */
function legOf(response: Response): Leg {
    return {
        status: response.status,
        authenticate: response.headers.get('www-authenticate'),
        // Read to the end, not cancelled: NTLM's next leg must reuse this connection.
        discard: async () => void (await response.arrayBuffer()),
    }
}

/**
 * Sends the request with its auth: signed up front, or answering the API's
 * challenge with a second request (Digest after a 401, and NTLM's handshake).
 */
async function exchange(
    request: SendRequest,
    url: URL,
    send: (outgoing: Outgoing) => Promise<Response>,
): Promise<Response> {
    let outgoing: Outgoing = {
        method: request.method,
        url,
        headers: request.headers,
        body: request.body,
    }
    const { auth } = request

    if (!auth) {
        return send(outgoing)
    }

    if (auth.type === 'ntlm') {
        const first = await send(ntlmNegotiate(outgoing))
        const next = flagValue(auth.values, 'disableRetryRequest')
            ? null
            : ntlmAuthenticate(outgoing, auth, legOf(first))

        if (!next) {
            return first
        }

        await legOf(first).discard()

        return send(next)
    }

    outgoing = signRequest(outgoing, auth)
    const response = await send(outgoing)
    const retry = digestRetry(outgoing, auth, legOf(response))

    if (!retry) {
        return response
    }

    await legOf(response).discard()

    return send(retry)
}

/** Sends an API request on the browser's behalf and returns the response. */
/**
 * Sends `request` and returns the response. `onProgress` hears how much of the response
 * body has arrived, as it arrives.
 */
export async function sendRequest(
    request: SendRequest,
    onProgress?: (progress: SendProgress) => void,
): Promise<SendResponse> {
    const url = parseTarget(request.url)

    if (!config.allowPrivateTargets) {
        assertPublicAddress(url)
    }

    const limits = effectiveLimits(request.options)
    const signal = AbortSignal.timeout(limits.timeoutMs)
    const lookup = config.allowPrivateTargets ? undefined : publicOnlyLookup

    // NTLM authenticates a connection, not a request, so both legs share one.
    const connection =
        request.auth?.type === 'ntlm'
            ? new Client(url.origin, {
                  connect: { lookup },
                  pipelining: 1,
              })
            : null
    const dispatcher: Dispatcher | undefined = connection ?? (lookup ? publicOnlyAgent : undefined)

    const startedAt = performance.now()

    try {
        const response = await exchange(request, url, (outgoing) =>
            fetch(outgoing.url, {
                method: outgoing.method,
                headers: outgoing.headers,
                body: BODYLESS_METHODS.includes(outgoing.method) ? null : outgoing.body,
                redirect: limits.redirect,
                dispatcher,
                signal,
            }),
        )
        // The size is known only for a body sent as it is: compressed, Content-Length counts the
        // compressed bytes, and what arrives here is already unpacked.
        const length = Number(response.headers.get('content-length'))
        const total =
            Number.isFinite(length) && length > 0 && !response.headers.get('content-encoding')
                ? Math.min(length, limits.maxBytes)
                : null

        onProgress?.({
            received: 0,
            total,
        })

        const { bytes, truncated } = await readBody(response, limits.maxBytes, (received) =>
            onProgress?.({
                received,
                total,
            }),
        )
        const isText = TEXT_CONTENT.test(response.headers.get('content-type') ?? MIME.text)

        return {
            status: response.status,
            statusText: response.statusText,
            headers: [...response.headers],
            body: bytes.toString(isText ? 'utf8' : 'base64'),
            bodyIsBase64: !isText,
            truncated,
            limitBytes: limits.maxBytes,
            sizeBytes: bytes.length,
            timeMs: Math.round(performance.now() - startedAt),
        }
    } catch (error) {
        throw describeFailure(error, limits.timeoutMs)
    } finally {
        await connection?.close()
    }
}
