import type { IncomingMessage, ServerResponse } from 'node:http'

import { config } from '#server/config.ts'
import { runIn } from '#server/database/context.ts'
import { requestTarget } from '#server/database/targets.ts'
import { HEADER, MIME, STATUS } from '#shared/http.ts'

/** An error with an HTTP status; its message is safe to show to the client. */
export class HttpError extends Error {
    status: number

    constructor(status: number, message: string) {
        super(message)
        this.status = status
    }
}

export interface Context {
    req: IncomingMessage
    res: ServerResponse
    /** Values of the `:name` segments in the route pattern. */
    params: Record<string, string>
}

/** A handler that wrote its own response (such as a stream) returns this. */
export const ANSWERED = Symbol('answered')

/** Returns the JSON response body, nothing for `204 No Content`, or `ANSWERED`. */
export type Handler = (context: Context) => unknown

export interface Route {
    method: string
    pattern: string
    handler: Handler
    /** Off for routes that pick the database, so they work while the picked one is unreachable. */
    usesDatabase: boolean
}

export function route(
    method: string,
    pattern: string,
    handler: Handler,
    { usesDatabase = true } = {},
): Route {
    return {
        method,
        pattern,
        handler,
        usesDatabase,
    }
}

function decodeSegment(segment: string): string {
    try {
        return decodeURIComponent(segment)
    } catch {
        throw new HttpError(STATUS.badRequest, 'Malformed URL.')
    }
}

function matchPattern(pattern: string, pathname: string): Record<string, string> | null {
    const patternParts = pattern.split('/')
    const pathParts = pathname.split('/')

    if (patternParts.length !== pathParts.length) {
        return null
    }

    const params: Record<string, string> = {}

    for (let i = 0; i < patternParts.length; i++) {
        const expected = patternParts[i]

        if (expected.startsWith(':')) {
            params[expected.slice(1)] = decodeSegment(pathParts[i])
        } else if (expected !== pathParts[i]) {
            return null
        }
    }

    return params
}

export function sendJson(res: ServerResponse, status: number, body: unknown): void {
    res.writeHead(status, {
        [HEADER.contentType]: MIME.jsonUtf8,
        'X-Content-Type-Options': 'nosniff',
    })
    res.end(JSON.stringify(body))
}

/** Whether the request names a host this server answers to (see `config.allowedHosts`). */
export function isAllowedHost(req: IncomingMessage): boolean {
    if (!config.allowedHosts) {
        return true
    }

    try {
        const hostname = new URL(`http://${req.headers.host}`).hostname.replace(/^\[|\]$/g, '')

        return config.allowedHosts.includes(hostname.toLowerCase())
    } catch {
        return false
    }
}

/**
 * Rejects requests a browser sent from another site. Session cookies are
 * `SameSite=Lax`; this covers what that leaves open.
 */
export function isSameOrigin(req: IncomingMessage): boolean {
    const origin = req.headers.origin

    // Not a cross-site browser request.
    if (!origin) {
        return true
    }

    try {
        return new URL(origin).host === req.headers.host
    } catch {
        return false
    }
}

/** Dispatches an `/api` request to the first matching route. */
export async function handleApi(
    routes: Route[],
    req: IncomingMessage,
    res: ServerResponse,
): Promise<void> {
    const { pathname } = new URL(req.url ?? '/', 'http://localhost')

    try {
        if (req.method !== 'GET' && !isSameOrigin(req)) {
            throw new HttpError(STATUS.forbidden, 'Cross-site request blocked.')
        }

        for (const { method, pattern, handler, usesDatabase } of routes) {
            if (method !== req.method) {
                continue
            }

            const params = matchPattern(pattern, pathname)

            if (!params) {
                continue
            }

            // Everything the handler does runs against the database this person picked.
            const run = () =>
                handler({
                    req,
                    res,
                    params,
                })
            const body = usesDatabase ? await runIn(await requestTarget(req), run) : await run()

            if (body === ANSWERED) {
                return
            }

            if (body === undefined) {
                res.writeHead(204).end()
            } else {
                sendJson(res, 200, body)
            }

            return
        }

        throw new HttpError(STATUS.notFound, 'Not found.')
    } catch (error) {
        if (error instanceof HttpError) {
            return sendJson(res, error.status, { error: error.message })
        }

        console.error(error)
        sendJson(res, STATUS.serverError, { error: 'Something went wrong on the server.' })
    }
}

export async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
    const chunks: Buffer[] = []
    let size = 0

    for await (const chunk of req) {
        size += chunk.length

        if (size > config.maxJsonBytes) {
            throw new HttpError(STATUS.payloadTooLarge, 'Request body is too large.')
        }

        chunks.push(chunk)
    }

    try {
        const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            return value as Record<string, unknown>
        }
    } catch {
        // Falls through to the error below.
    }

    throw new HttpError(STATUS.badRequest, 'Expected a JSON object.')
}

/** Reads a required, non-empty string field from a JSON body. */
export function stringField(body: Record<string, unknown>, name: string, maxLength = 200): string {
    const value = body[name]

    if (typeof value !== 'string' || !value.trim()) {
        throw new HttpError(STATUS.badRequest, `"${name}" is required.`)
    }

    if (value.length > maxLength) {
        throw new HttpError(STATUS.badRequest, `"${name}" is too long.`)
    }

    return value.trim()
}
