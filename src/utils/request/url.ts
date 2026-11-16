import { newKeyValue } from '@/constants'
import type { HttpRequest, KeyValue } from '#shared/types.ts'

import { pathVariableNames } from './buildRequest'

/** The URL as the bar shows it: the address, then the switched-on params as written. */
export function composeUrl(request: Pick<HttpRequest, 'url' | 'params'>): string {
    const query = request.params
        .filter((param) => param.enabled)
        .map(({ key, value }) => (value === '' && !key ? '' : `${key}=${value}`))

    return query.length > 0 ? `${request.url}?${query.join('&')}` : request.url
}

function parseQuery(query: string): {
    key: string
    value: string
}[] {
    if (!query) {
        return []
    }

    return query.split('&').map((part) => {
        const separator = part.indexOf('=')

        return separator === -1
            ? {
                  key: part,
                  value: '',
              }
            : {
                  key: part.slice(0, separator),
                  value: part.slice(separator + 1),
              }
    })
}

/**
 * Keeps the path variable rows in step with the `:name` segments of `url`:
 * new names get an empty row, rows for names that left the URL are dropped,
 * and existing values and descriptions stay.
 */
export function syncPathVariables(url: string, rows: KeyValue[] | undefined): KeyValue[] {
    const existing = new Map((rows ?? []).map((row) => [row.key, row]))

    return pathVariableNames(url).map((name) => existing.get(name) ?? newKeyValue(name, ''))
}

/**
 * Applies text typed in the URL bar. The address and path variables follow the
 * text. The typed query fills the switched-on params' places in order, reusing
 * their ids and descriptions; switched-off params keep their places; extra typed
 * params go at the end, and switched-on params with nothing typed for them go.
 */
export function applyUrlText(
    request: HttpRequest,
    text: string,
): Pick<HttpRequest, 'url' | 'params' | 'pathVariables'> {
    const separator = text.indexOf('?')
    const url = separator === -1 ? text : text.slice(0, separator)
    const typed = parseQuery(separator === -1 ? '' : text.slice(separator + 1))

    const params: KeyValue[] = []
    let next = 0

    for (const param of request.params) {
        if (!param.enabled) {
            params.push(param)
        } else if (next < typed.length) {
            params.push({
                ...param,
                ...typed[next++],
            })
        }
    }

    for (const { key, value } of typed.slice(next)) {
        params.push(newKeyValue(key, value))
    }

    return {
        url,
        params,
        pathVariables: syncPathVariables(url, request.pathVariables),
    }
}
