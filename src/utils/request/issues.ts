import { ancestorNames, type ItemsById, rootCollection } from '@/utils/collections/tree'
import { toSendableJson } from '@/utils/json/jsonStyle'
import { textValue } from '#shared/auth.ts'
import type { Environment, HttpItem, Item, KeyValue } from '#shared/types.ts'

import { pathVariableNames } from './buildRequest'
import { scopeVariables, unresolvedVariables, type Variables } from './variables'

export interface Issue {
    severity: 'error' | 'warning'
    /** What to open to fix it. */
    target: {
        kind: 'item' | 'environment'
        id: string
    }
    /** Where it is, such as "Shop / Orders / Create order". */
    where: string
    message: string
}

const AUTH_JSON_FIELDS: Record<string, [string, string][]> = {
    jwt: [
        ['payload', 'JWT payload'],
        ['header', 'JWT headers field'],
    ],
    asap: [['claims', 'additional claims field']],
}

const PLACEHOLDER = /\{\{[^{}]+\}\}/g

/** Why a JSON text does not parse, or null when it does. `{{variables}}` count as values. */
function jsonProblem(text: string): string | null {
    if (!text.trim()) {
        return null
    }

    try {
        JSON.parse(text.replace(PLACEHOLDER, '0'))

        return null
    } catch (error) {
        return (error as Error).message
    }
}

const enabledRows = (rows: KeyValue[] | undefined) =>
    (rows ?? []).filter((row) => row.enabled && row.key)

function duplicateKeys(rows: KeyValue[] | undefined): string[] {
    const seen = new Set<string>()
    const repeated = new Set<string>()

    for (const { key } of enabledRows(rows)) {
        ;(seen.has(key) ? repeated : seen).add(key)
    }

    return [...repeated]
}

const quoteList = (names: string[]) => names.map((name) => `{{${name}}}`).join(', ')

/** Every text in a request that `{{variables}}` can appear in. */
function requestTexts(item: HttpItem): string[] {
    const { request } = item
    const texts = [
        request.url,
        ...enabledRows(request.params).flatMap((row) => [row.key, row.value]),
        ...enabledRows(request.headers).flatMap((row) => [row.key, row.value]),
        ...(request.pathVariables ?? []).map((row) => row.value),
    ]

    if (request.body.type === 'raw') {
        texts.push(request.body.text)
    }

    if (request.body.type === 'urlencoded') {
        texts.push(...enabledRows(request.body.fields).flatMap((row) => [row.key, row.value]))
    }

    const { auth } = request

    if ('values' in auth) {
        texts.push(
            ...Object.values(auth.values).filter(
                (value): value is string => typeof value === 'string',
            ),
        )
    } else if (auth.type !== 'none') {
        texts.push(
            ...Object.values(auth).filter((value): value is string => typeof value === 'string'),
        )
    }

    return texts
}

function requestIssues(
    item: HttpItem,
    variables: Variables,
    add: (severity: Issue['severity'], message: string) => void,
): void {
    const { request } = item

    // A warning, not an error: every new request starts with an empty URL.
    if (!request.url.trim()) {
        add('warning', 'The URL is empty.')
    }

    if (request.body.type === 'raw' && request.body.language === 'json') {
        const problem = jsonProblem(toSendableJson(request.body.text))

        if (problem) {
            add('error', `The JSON body is not valid: ${problem}`)
        }
    }

    const { auth } = request

    if ('values' in auth) {
        for (const [key, label] of AUTH_JSON_FIELDS[auth.type] ?? []) {
            const problem = jsonProblem(textValue(auth.values, key))

            if (problem) {
                add('error', `The ${label} is not valid JSON: ${problem}`)
            }
        }
    }

    const filled = new Set(
        (request.pathVariables ?? []).filter((row) => row.value).map((row) => row.key),
    )
    const empty = pathVariableNames(request.url).filter((name) => !filled.has(name))

    if (empty.length) {
        add(
            'warning',
            `${empty.map((name) => `:${name}`).join(', ')} ${empty.length === 1 ? 'has' : 'have'} no value, so the URL is sent as written.`,
        )
    }

    const missing = [
        ...new Set(requestTexts(item).flatMap((text) => unresolvedVariables(text, variables))),
    ]

    if (missing.length) {
        add(
            'warning',
            `${quoteList(missing)} ${missing.length === 1 ? 'has' : 'have'} no value in the collection or the active environment.`,
        )
    }
}

/** All issues, errors first, then in tree order. */
export function findIssues(
    items: ItemsById,
    environments: Record<string, Environment>,
    active: Environment | undefined,
): Issue[] {
    const issues: Issue[] = []
    const pathOf = (item: Item) => [...ancestorNames(items, item), item.name].join(' / ')

    for (const item of Object.values(items)) {
        const add = (severity: Issue['severity'], message: string) =>
            issues.push({
                severity,
                target: {
                    kind: 'item',
                    id: item.id,
                },
                where: pathOf(item),
                message,
            })

        if (item.kind === 'http') {
            requestIssues(
                item,
                scopeVariables(rootCollection(items, item)?.variables, active?.variables),
                add,
            )
        } else if (item.kind === 'websocket') {
            if (!/^wss?:\/\/\S+/i.test(item.url.trim())) {
                add('error', 'The WebSocket URL must start with ws:// or wss://.')
            }
        } else if (item.kind === 'collection') {
            const repeated = duplicateKeys(item.variables)

            if (repeated.length) {
                add(
                    'warning',
                    `Collection variables ${repeated.join(', ')} are set more than once; the last one wins.`,
                )
            }
        }
    }

    for (const environment of Object.values(environments)) {
        const repeated = duplicateKeys(environment.variables)

        if (repeated.length) {
            issues.push({
                severity: 'warning',
                target: {
                    kind: 'environment',
                    id: environment.id,
                },
                where: environment.name,
                message: `Variables ${repeated.join(', ')} are set more than once; the last one wins.`,
            })
        }
    }

    return issues.sort((a, b) => {
        if (a.severity === b.severity) {
            return a.where.localeCompare(b.where)
        }

        return a.severity === 'error' ? -1 : 1
    })
}
