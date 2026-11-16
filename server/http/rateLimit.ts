import type { IncomingMessage } from 'node:http'

import { STATUS } from '#shared/http.ts'

import { HttpError } from './router.ts'

const PRUNE_ABOVE = 10_000

/**
 * Allows `limit` attempts per key in each `windowMs`. Kept in memory, so it
 * resets when the server restarts. Returns a function that records one attempt
 * and throws `429` once the key is over its limit.
 */
export function createRateLimit(limit: number, windowMs: number): (key: string) => void {
    const windows = new Map<
        string,
        {
            count: number
            resetAt: number
        }
    >()

    return (key) => {
        const now = Date.now()

        if (windows.size > PRUNE_ABOVE) {
            for (const [stale, window] of windows) {
                if (window.resetAt <= now) {
                    windows.delete(stale)
                }
            }
        }

        const window = windows.get(key)

        if (!window || window.resetAt <= now) {
            windows.set(key, {
                count: 1,
                resetAt: now + windowMs,
            })

            return
        }

        if (++window.count > limit) {
            const minutes = Math.ceil((window.resetAt - now) / 60_000)

            throw new HttpError(
                STATUS.tooManyRequests,
                `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
            )
        }
    }
}

/** The address the request came from. Behind a reverse proxy this is the proxy. */
export function clientAddress(req: IncomingMessage): string {
    return req.socket.remoteAddress ?? 'unknown'
}
