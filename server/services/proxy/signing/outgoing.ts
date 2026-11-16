import { MIME } from '#shared/http.ts'

/** The request about to be sent, as the signers see and change it. */
export interface Outgoing {
    method: string
    url: URL
    headers: [name: string, value: string][]
    body: string | null
}

export function getHeader(outgoing: Outgoing, name: string): string | undefined {
    const lower = name.toLowerCase()

    return outgoing.headers.find(([key]) => key.toLowerCase() === lower)?.[1]
}

/** Adds a header unless the request already sets it: headers the user wrote win over auth. */
export function withHeader(outgoing: Outgoing, name: string, value: string): Outgoing {
    if (getHeader(outgoing, name) !== undefined) {
        return outgoing
    }

    return {
        ...outgoing,
        headers: [...outgoing.headers, [name, value]],
    }
}

/** Replaces a header, for the second leg of a challenge, where the first leg's value must go. */
export function replaceHeader(outgoing: Outgoing, name: string, value: string): Outgoing {
    const lower = name.toLowerCase()

    return {
        ...outgoing,
        headers: [
            ...outgoing.headers.filter(([key]) => key.toLowerCase() !== lower),
            [name, value],
        ],
    }
}

export function withQuery(outgoing: Outgoing, pairs: [string, string][]): Outgoing {
    const url = new URL(outgoing.url)

    for (const [key, value] of pairs) {
        url.searchParams.append(key, value)
    }

    return {
        ...outgoing,
        url,
    }
}

/** RFC 3986 percent-encoding: like encodeURIComponent, but also ! ' ( ) and *. */
export function percentEncode(text: string): string {
    return encodeURIComponent(text).replace(
        /[!'()*]/g,
        (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
    )
}

function compareText(a: string, b: string): number {
    if (a < b) {
        return -1
    }

    return a > b ? 1 : 0
}

/** Each pair percent-encoded, sorted by name and then by value. */
export function sortedEncodedPairs(pairs: [string, string][]): [string, string][] {
    return pairs
        .map(([key, value]): [string, string] => [percentEncode(key), percentEncode(value)])
        .sort(
            ([keyA, valueA], [keyB, valueB]) =>
                compareText(keyA, keyB) || compareText(valueA, valueB),
        )
}

/** The media type without parameters, lowercase: `application/json; charset=utf-8` becomes `application/json`. */
export function mediaType(outgoing: Outgoing): string {
    return (getHeader(outgoing, 'content-type') ?? '').split(';')[0].trim().toLowerCase()
}

export function isFormBody(outgoing: Outgoing): boolean {
    return mediaType(outgoing) === MIME.form && outgoing.body !== null
}

/** The parts of a `WWW-Authenticate` challenge, such as `Digest realm="x", nonce="y"`. */
export function parseChallenge(header: string, scheme: string): Record<string, string> | null {
    const start = header.toLowerCase().indexOf(scheme.toLowerCase())

    if (start === -1) {
        return null
    }

    const params: Record<string, string> = {}

    for (const match of header
        .slice(start + scheme.length)
        .matchAll(/([\w-]+)\s*=\s*(?:"((?:\\.|[^"\\])*)"|([^\s,]+))/g)) {
        params[match[1].toLowerCase()] =
            match[2] !== undefined ? match[2].replace(/\\(.)/g, '$1') : match[3]
    }

    return params
}

/** A value for a quoted header parameter. */
export function quoted(value: string): string {
    return `"${value.replace(/(["\\])/g, '\\$1')}"`
}
