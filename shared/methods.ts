/** HTTP methods: the common ones listed in menus, and the rule any other method must follow. */

export const STANDARD_METHODS = [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'HEAD',
    'OPTIONS',
] as const

/** A token of capital letters, digits, `-` and `_`, such as PROPFIND or PURGE. */
const METHOD_TOKEN = /^[A-Z][A-Z0-9_-]{0,23}$/

/** Methods browsers and fetch refuse to send. */
const FORBIDDEN_METHODS = ['CONNECT', 'TRACE', 'TRACK']

export function isHttpMethod(value: unknown): value is string {
    return (
        typeof value === 'string' && METHOD_TOKEN.test(value) && !FORBIDDEN_METHODS.includes(value)
    )
}

/** Turns typed text into a method (trimmed, in capitals), or explains why it cannot be one. */
export function parseMethod(text: string): { method: string } | { error: string } {
    const method = text.trim().toUpperCase()

    if (!method) {
        return { error: 'Type a method name.' }
    }

    if (FORBIDDEN_METHODS.includes(method)) {
        return { error: `${method} cannot be sent from Kynova.` }
    }

    if (!METHOD_TOKEN.test(method)) {
        return { error: 'Use letters, digits, - and _ only, up to 24 characters.' }
    }

    return { method }
}
