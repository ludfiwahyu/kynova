import type { KeyValue } from '#shared/types.ts'

export type Variables = Record<string, string>

const PLACEHOLDER = /\{\{\s*([^{}]+?)\s*\}\}/g

/**
 * Dynamic variables: each `{{$name}}` gets a fresh value every time
 * it appears. Only the commonly used ones are supported.
 */
const DYNAMIC_VARIABLES: Record<string, () => string> = {
    $guid: () => crypto.randomUUID(),
    $randomUUID: () => crypto.randomUUID(),
    $timestamp: () => String(Math.floor(Date.now() / 1000)),
    $isoTimestamp: () => new Date().toISOString(),
    $randomInt: () => String(Math.floor(Math.random() * 1001)),
}

/** Enabled, named rows by name. */
function enabledValues(rows: KeyValue[] | undefined): Variables {
    const variables: Variables = {}

    for (const { key, value, enabled } of rows ?? []) {
        if (enabled && key) {
            variables[key] = value
        }
    }

    return variables
}

/**
 * The variables a request can use: the collection's
 * variables, overridden by the active environment's.
 */
export function scopeVariables(
    collectionVariables: KeyValue[] | undefined,
    environment: KeyValue[] | undefined,
): Variables {
    return {
        ...enabledValues(collectionVariables),
        ...enabledValues(environment),
    }
}

/** Replaces each `{{name}}` with its value. Unknown names are left as written. */
export function resolveVariables(text: string, variables: Variables): string {
    return text.replace(PLACEHOLDER, (placeholder, name: string) => {
        if (name in variables) {
            return variables[name]
        }

        return DYNAMIC_VARIABLES[name]?.() ?? placeholder
    })
}

/** Names used as `{{name}}` in `text` that have no value. */
export function unresolvedVariables(text: string, variables: Variables): string[] {
    const names = [...text.matchAll(PLACEHOLDER)].map((match) => match[1])

    return [...new Set(names)].filter(
        (name) => !(name in variables) && !(name in DYNAMIC_VARIABLES),
    )
}

/** Names used as `{{name}}` in `text`, each once, without the dynamic ones. */
export function usedVariables(text: string): string[] {
    const names = [...text.matchAll(PLACEHOLDER)].map((match) => match[1])

    return [...new Set(names)].filter((name) => !(name in DYNAMIC_VARIABLES))
}

// ── Suggestions and the variable under the pointer ──────────────────────

/** Where a variable's value comes from. */
export type VariableScope = 'environment' | 'collection' | 'dynamic'

export interface VariableEntry {
    name: string
    value: string
    /** Unknown when the field was given only names and values. */
    scope?: VariableScope
}

/** What each dynamic variable gives, for the suggestions. */
export const DYNAMIC_VARIABLE_HINTS: Record<string, string> = {
    $guid: 'A new UUID each time',
    $randomUUID: 'A new UUID each time',
    $timestamp: 'The current Unix time, in seconds',
    $isoTimestamp: 'The current time, ISO 8601',
    $randomInt: 'A random whole number from 0 to 1000',
}

/**
 * Every variable a request can use, for suggestions: the active environment's first
 * (it wins over the collection's), then the collection's, then the dynamic ones.
 */
export function variableEntries(
    collectionVariables: KeyValue[] | undefined,
    environment: KeyValue[] | undefined,
): VariableEntry[] {
    const fromEnvironment = enabledValues(environment)
    const fromCollection = enabledValues(collectionVariables)

    return [
        ...Object.entries(fromEnvironment).map(([name, value]) => ({
            name,
            value,
            scope: 'environment' as const,
        })),
        ...Object.entries(fromCollection)
            .filter(([name]) => !(name in fromEnvironment))
            .map(([name, value]) => ({
                name,
                value,
                scope: 'collection' as const,
            })),
        ...Object.entries(DYNAMIC_VARIABLE_HINTS).map(([name, value]) => ({
            name,
            value,
            scope: 'dynamic' as const,
        })),
    ]
}

/**
 * The `{{` being typed just before `caret`, and the name typed after it so far
 * (letters, digits, `_`, `$`, `.` and `-`); null when the caret is not in an unfinished `{{`.
 */
export function variableQuery(
    text: string,
    caret: number,
): {
    start: number
    query: string
} | null {
    const match = /\{\{\s*([\w$.-]*)$/.exec(text.slice(0, caret))

    return match
        ? {
              start: match.index,
              query: match[1],
          }
        : null
}

/**
 * Puts `{{name}}` in place of the `{{query` from `start` to `caret`. A name and closing
 * braces already right after the caret are replaced too, so nothing is doubled.
 */
export function insertVariable(
    text: string,
    start: number,
    caret: number,
    name: string,
): {
    text: string
    caret: number
} {
    const rest = /^[\w$.-]*\s*(\}\})?/.exec(text.slice(caret))![0]
    const placeholder = `{{${name}}}`

    return {
        text: text.slice(0, start) + placeholder + text.slice(caret + rest.length),
        caret: start + placeholder.length,
    }
}

/** The variables whose name contains `query`: names that start with it first, then A to Z. */
export function matchVariables(entries: VariableEntry[], query: string): VariableEntry[] {
    const wanted = query.toLowerCase()

    return entries
        .filter(({ name }) => name.toLowerCase().includes(wanted))
        .sort((a, b) => {
            const aStarts = a.name.toLowerCase().startsWith(wanted) ? 0 : 1
            const bStarts = b.name.toLowerCase().startsWith(wanted) ? 0 : 1

            return aStarts - bStarts
        })
}

/** The `{{name}}` that covers character `index`, with where it starts and ends. */
export function placeholderAt(
    text: string,
    index: number,
): {
    start: number
    end: number
    name: string
} | null {
    for (const match of text.matchAll(PLACEHOLDER)) {
        const end = match.index + match[0].length

        if (index >= match.index && index < end) {
            return {
                start: match.index,
                end,
                name: match[1],
            }
        }
    }

    return null
}
