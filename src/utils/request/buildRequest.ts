import { isSignedAuthType, textValue } from '#shared/auth.ts'
import { HEADER, MIME } from '#shared/http.ts'
import type {
    Auth,
    AuthValues,
    Body,
    HttpRequest,
    KeyValue,
    RawLanguage,
    SendAuth,
    SendRequest,
} from '#shared/types.ts'

import { resolveVariables, type Variables } from './variables'

type Pair = [name: string, value: string]

const RAW_CONTENT_TYPES: Record<RawLanguage, string> = {
    json: MIME.json,
    text: MIME.text,
    xml: 'application/xml',
    html: 'text/html',
    javascript: 'application/javascript',
}

/** A `:name` path segment, the usual way to write path variables: `/users/:id/posts`. */
const PATH_VARIABLE = /(?<=\/):([A-Za-z_][\w-]*)/g

/** Names of the `:name` segments in a URL, in order. */
export function pathVariableNames(url: string): string[] {
    const path = url.split('?')[0]

    return [...new Set([...path.matchAll(PATH_VARIABLE)].map((match) => match[1]))]
}

/** Enabled, named rows as pairs, with variables filled in. */
function activePairs(rows: KeyValue[], variables: Variables): Pair[] {
    return rows
        .filter((row) => row.enabled && row.key.trim())
        .map((row) => [
            resolveVariables(row.key, variables),
            resolveVariables(row.value, variables),
        ])
}

function encodeQuery(pairs: Pair[]): string {
    return pairs
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')
}

function base64(text: string): string {
    const bytes = new TextEncoder().encode(text)

    return btoa(String.fromCharCode(...bytes))
}

/** OAuth 2.0 sends its token as `Authorization: <prefix> <token>`, or as `access_token` in the query. */
function oauth2TokenGoesInQuery(auth: Auth): boolean {
    return auth.type === 'oauth2' && textValue(auth.values, 'addTokenTo') === 'queryParams'
}

function authHeader(auth: Auth, variables: Variables): Pair | null {
    const resolve = (text: string) => resolveVariables(text, variables)

    switch (auth.type) {
        case 'oauth2': {
            const token = resolve(textValue(auth.values, 'accessToken'))

            if (!token || oauth2TokenGoesInQuery(auth)) {
                return null
            }

            const prefix = resolve(textValue(auth.values, 'headerPrefix', 'Bearer')).trim()

            return [HEADER.authorization, prefix ? `${prefix} ${token}` : token]
        }
        case 'bearer':
            return [HEADER.authorization, `Bearer ${resolve(auth.token)}`]
        case 'basic':
            return [
                HEADER.authorization,
                `Basic ${base64(`${resolve(auth.username)}:${resolve(auth.password)}`)}`,
            ]
        case 'apikey':
            return auth.addTo === 'header' && auth.key
                ? [resolve(auth.key), resolve(auth.value)]
                : null
        default:
            // No auth, or auth the server signs as it sends.
            return null
    }
}

function authQuery(auth: Auth, variables: Variables): Pair | null {
    if (auth.type === 'oauth2' && oauth2TokenGoesInQuery(auth)) {
        const token = resolveVariables(textValue(auth.values, 'accessToken'), variables)

        return token ? ['access_token', token] : null
    }

    if (auth.type !== 'apikey' || auth.addTo !== 'query' || !auth.key) {
        return null
    }

    return [resolveVariables(auth.key, variables), resolveVariables(auth.value, variables)]
}

/** Auth for the server to sign, with variables filled in. Tables (OAuth 2.0 only) are left out. */
function authToSign(auth: Auth, variables: Variables): SendAuth | undefined {
    if (!isSignedAuthType(auth.type) || !('values' in auth)) {
        return undefined
    }

    const values: AuthValues = {}

    for (const [key, value] of Object.entries(auth.values)) {
        if (typeof value === 'string') {
            values[key] = resolveVariables(value, variables)
        } else if (!Array.isArray(value)) {
            values[key] = value
        }
    }

    return {
        type: auth.type,
        values,
    }
}

function encodeBody(
    body: Body,
    variables: Variables,
): {
    text: string
    contentType: string
} | null {
    switch (body.type) {
        case 'raw':
            return {
                text: resolveVariables(body.text, variables),
                contentType: RAW_CONTENT_TYPES[body.language],
            }
        case 'urlencoded':
            return {
                text: encodeQuery(activePairs(body.fields, variables)),
                contentType: MIME.form,
            }
        case 'none':
            return null
    }
}

/** Replaces `:name` segments with their values. Segments without a value stay as written. */
function fillPathVariables(
    url: string,
    rows: KeyValue[] | undefined,
    variables: Variables,
): string {
    const values = new Map((rows ?? []).filter((row) => row.key).map((row) => [row.key, row.value]))

    return url.replace(PATH_VARIABLE, (segment, name: string) => {
        const value = values.get(name)

        return value === undefined || value === ''
            ? segment
            : encodeURIComponent(resolveVariables(value, variables))
    })
}

function buildUrl(request: HttpRequest, variables: Variables): string {
    let url = fillPathVariables(
        resolveVariables(request.url.trim(), variables),
        request.pathVariables,
        variables,
    )

    if (url && !/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
        url = `http://${url}`
    }

    const query = [...activePairs(request.params, variables)]
    const authPair = authQuery(request.auth, variables)

    if (authPair) {
        query.push(authPair)
    }

    if (query.length === 0) {
        return url
    }

    return url + (url.includes('?') ? '&' : '?') + encodeQuery(query)
}

/**
 * Turns an editable request into the exact one to send: variables filled in,
 * params appended to the URL, auth applied, and the body encoded.
 * Headers the user set win over the ones auth and the body would add.
 */
export function buildSendRequest(request: HttpRequest, variables: Variables): SendRequest {
    const headers = activePairs(request.headers, variables)
    const hasHeader = (name: string) =>
        headers.some(([key]) => key.toLowerCase() === name.toLowerCase())

    const authPair = authHeader(request.auth, variables)

    if (authPair && !hasHeader(authPair[0])) {
        headers.push(authPair)
    }

    const body = encodeBody(request.body, variables)

    if (body && !hasHeader(HEADER.contentType)) {
        headers.push([HEADER.contentType, body.contentType])
    }

    const auth = authToSign(request.auth, variables)

    return {
        method: request.method,
        url: buildUrl(request, variables),
        headers,
        body: body?.text ?? null,
        ...(auth && { auth }),
    }
}
