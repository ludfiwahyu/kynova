import type { AuthField } from '@/pages/request/logic/authTypes'
import type { ItemsById, Variables } from '@/utils'
import { resolveVariables } from '@/utils'
import type { AuthValue, AuthValues, Body, Item, KeyValue, SendResponse } from '#shared/types.ts'

/** Switching type keeps nothing from the old one. */
export function emptyBody(type: Body['type']): Body {
    switch (type) {
        case 'raw':
            return {
                type,
                language: 'json',
                text: '',
            }
        case 'urlencoded':
            return {
                type,
                fields: [],
            }
        case 'none':
            return { type }
    }
}

export function activeCount(rows: KeyValue[]): number {
    return rows.filter((row) => row.enabled && row.key).length
}

export function contentType(response: SendResponse): string {
    return response.headers.find(([name]) => name.toLowerCase() === 'content-type')?.[1] ?? ''
}

export function current(
    field: AuthField,
    values: AuthValues,
    defaults: AuthValues,
): AuthValue | undefined {
    return values[field.key] ?? defaults[field.key]
}

function resolveValue(value: AuthValue, variables: Variables): AuthValue {
    if (typeof value === 'string') {
        return resolveVariables(value, variables)
    }

    if (!Array.isArray(value)) {
        return value
    }

    return value.map((row) => ({
        ...row,
        key: resolveVariables(row.key, variables),
        value: resolveVariables(row.value, variables),
    }))
}

/** Every text setting and table cell with its `{{variables}}` filled in. */
export function resolveValues(values: AuthValues, variables: Variables): AuthValues {
    return Object.fromEntries(
        Object.entries(values).map(([key, value]) => [key, resolveValue(value, variables)]),
    )
}

export function expiryText(expiresAt: number | undefined): string {
    if (!expiresAt) {
        return ''
    }

    const minutes = Math.round((expiresAt - Date.now()) / 60000)

    if (minutes <= 0) {
        return ' (expired)'
    }

    return minutes < 120 ? ` (${minutes} min left)` : ''
}

export function nextAutoClosing(current: string): 'never' | 'languageDefined' {
    return current === 'never' ? 'languageDefined' : 'never'
}

export function ancestorsOf(items: ItemsById, item: Item): Item[] {
    const ancestors: Item[] = []

    for (
        let parent = item.parentId ? items[item.parentId] : undefined;
        parent;
        parent = parent.parentId ? items[parent.parentId] : undefined
    ) {
        ancestors.unshift(parent)
    }

    return ancestors
}

export function visibleFields(
    fields: AuthField[],
    values: AuthValues,
    defaults: AuthValues,
): AuthField[] {
    return fields.filter(
        (field) =>
            !field.when ||
            field.when({
                ...defaults,
                ...values,
            }),
    )
}

/** Whether a body is a JSON object or array, whatever its content type says. */
export function looksLikeJson(body: string): boolean {
    if (!/^\s*[{[]/.test(body)) {
        return false
    }

    try {
        JSON.parse(body)

        return true
    } catch {
        return false
    }
}
