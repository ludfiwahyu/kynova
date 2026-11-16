import { childrenOf, type ItemsById } from '@/utils/collections/tree'
import { newId } from '@/utils/common/id'
import { isSignedAuthType } from '#shared/auth.ts'
import { isHttpMethod } from '#shared/methods.ts'
import type {
    Auth,
    AuthParam,
    AuthValue,
    AuthValues,
    Body,
    CollectionItem,
    HttpItem,
    HttpRequest,
    Item,
    KeyOrder,
    KeyValue,
    RawLanguage,
    Scripts,
} from '#shared/types.ts'

/** The schema name and id key that collection files carry. */
export const COLLECTION_SCHEMA = 'collection/v2.1'
export const COLLECTION_ID_KEY = '_collection_id'
const RAW_LANGUAGES: RawLanguage[] = ['json', 'text', 'xml', 'html', 'javascript']
const SCRIPT_TYPE = 'text/javascript'

/** The collection format's event names, mapped to the script phase each one holds. */
const EVENTS = [
    {
        listen: 'prerequest',
        phase: 'preRequest',
    },
    {
        listen: 'test',
        phase: 'test',
    },
] as const

// The format is external input, so nodes are read defensively as loose JSON.
type Json = Record<string, any>

/** The usual key order of exported files. Used for collections made in Kynova. */
const KEY_ORDER: Required<KeyOrder> = {
    collection: ['info', 'item', 'event', 'variable'],
    info: [COLLECTION_ID_KEY, 'name', 'description', 'schema'],
    folder: ['name', 'item', 'description', 'event'],
    item: ['name', 'event', 'request', 'response'],
    request: ['auth', 'method', 'header', 'body', 'url', 'description'],
    url: ['raw', 'protocol', 'host', 'port', 'path', 'query', 'variable'],
}

/** Rebuilds `object` with its keys in `order`; keys the order does not name keep their place at the end. */
function ordered(object: Json, order: string[]): Json {
    const rank = (key: string) => {
        const index = order.indexOf(key)

        return index === -1 ? order.length : index
    }

    return Object.fromEntries(Object.entries(object).sort(([a], [b]) => rank(a) - rank(b)))
}

/** Sets `key` only when `value` is defined, so absent stays absent. */
function withOptional(target: Json, key: string, value: unknown): Json {
    if (value !== undefined) {
        target[key] = value
    }

    return target
}

// ── Export ───────────────────────────────────────────────────────────────

function exportPairs(rows: KeyValue[]): Json[] {
    return rows.map(({ key, value, enabled, description, type }) => {
        const pair: Json = {
            key,
            value,
        }

        withOptional(pair, 'type', type)
        withOptional(pair, 'description', description)

        if (!enabled) {
            pair.disabled = true
        }

        return pair
    })
}

function exportEvents(scripts: Scripts | undefined): Json[] | undefined {
    const events = EVENTS.filter(({ phase }) => scripts?.[phase] !== undefined).map(
        ({ listen, phase }) => {
            const text = scripts![phase]!

            return {
                listen,
                script: {
                    type: SCRIPT_TYPE,
                    exec: text === '' ? [] : text.split('\n'),
                },
            }
        },
    )

    return events.length > 0 ? events : undefined
}

/** Splits a URL without its query into the format's `protocol`, `host`, `port` and `path` parts. */
function splitUrl(base: string): Json {
    const parts: Json = {}
    let rest = base

    const protocol = rest.match(/^([a-z][\w+.-]*):\/\//i)

    if (protocol) {
        parts.protocol = protocol[1]
        rest = rest.slice(protocol[0].length)
    }

    const slash = rest.indexOf('/')
    const authority = slash === -1 ? rest : rest.slice(0, slash)
    const port = authority.match(/:(\d+)$/)
    const hostname = port ? authority.slice(0, -port[0].length) : authority

    // A host written as a variable ({{base_url}}) stays one piece; a real host splits on dots.
    parts.host = hostname.startsWith('{{') ? [hostname] : hostname.split('.')

    if (port) {
        parts.port = port[1]
    }

    if (slash !== -1) {
        parts.path = rest.slice(slash + 1).split('/')
    }

    return parts
}

function exportUrl(request: HttpRequest, order: Required<KeyOrder>): Json {
    const query = request.params
        .filter((param) => param.enabled)
        .map(({ key, value }) => `${key}=${value}`)
    const raw = query.length > 0 ? `${request.url}?${query.join('&')}` : request.url

    const url: Json = {
        raw,
        ...(request.url ? splitUrl(request.url) : {}),
    }

    if (request.params.length > 0) {
        url.query = exportPairs(request.params)
    }

    if (request.pathVariables?.length) {
        url.variable = exportPairs(request.pathVariables)
    }

    return ordered(url, order.url)
}

function authValueType(value: unknown): string {
    if (typeof value === 'boolean') {
        return 'boolean'
    }

    return typeof value === 'string' ? 'string' : 'any'
}

function exportAuth(auth: Auth): Json | undefined {
    const field = (key: string, value: string) => ({
        key,
        value,
        type: 'string',
    })

    switch (auth.type) {
        case 'bearer':
            return {
                type: 'bearer',
                bearer: [field('token', auth.token)],
            }
        case 'basic':
            return {
                type: 'basic',
                basic: [field('username', auth.username), field('password', auth.password)],
            }
        case 'apikey':
            return {
                type: 'apikey',
                apikey: [
                    field('key', auth.key),
                    field('value', auth.value),
                    field('in', auth.addTo),
                ],
            }
        case 'none':
            return undefined
        default:
            return {
                type: auth.type,
                [auth.type]: Object.entries(auth.values).map(([key, value]) => ({
                    key,
                    value,
                    type: authValueType(value),
                })),
            }
    }
}

function exportBody(body: Body): Json | undefined {
    switch (body.type) {
        case 'raw':
            return {
                mode: 'raw',
                raw: body.text,
                options: { raw: { language: body.language } },
            }
        case 'urlencoded':
            return {
                mode: 'urlencoded',
                urlencoded: exportPairs(body.fields),
            }
        case 'none':
            return undefined
    }
}

function exportRequest(item: HttpItem, order: Required<KeyOrder>): Json {
    const { request } = item
    const exported: Json = {}

    withOptional(exported, 'auth', exportAuth(request.auth))
    exported.method = request.method
    exported.header = exportPairs(request.headers)
    exported.url = exportUrl(request, order)
    withOptional(exported, 'description', item.description)
    withOptional(exported, 'body', exportBody(request.body))

    return ordered(exported, order.request)
}

function exportChildren(items: ItemsById, parentId: string, order: Required<KeyOrder>): Json[] {
    return childrenOf(items, parentId).flatMap((item): Json[] => {
        if (item.kind === 'folder') {
            const folder: Json = { name: item.name }

            withOptional(folder, 'description', item.description)
            folder.item = exportChildren(items, item.id, order)
            withOptional(folder, 'event', exportEvents(item.scripts))

            return [ordered(folder, order.folder)]
        }

        if (item.kind === 'http') {
            const request: Json = {
                name: item.name,
                request: exportRequest(item, order),
                response: [],
            }

            withOptional(request, 'event', exportEvents(item.scripts))

            return [ordered(request, order.item)]
        }

        return [] // WebSocket requests have no place in the v2.1 format.
    })
}

export function exportCollection(items: ItemsById, collectionId: string): string {
    const collection = items[collectionId] as CollectionItem
    const order = {
        ...KEY_ORDER,
        ...collection.keyOrder,
    }

    const info: Json = {}

    withOptional(info, COLLECTION_ID_KEY, collection.sourceId)
    info.name = collection.name
    withOptional(info, 'description', collection.description)
    info.schema = COLLECTION_SCHEMA

    const exported: Json = { info: ordered(info, order.info) }

    if (collection.variables?.length) {
        exported.variable = exportPairs(collection.variables)
    }

    exported.item = exportChildren(items, collectionId, order)
    withOptional(exported, 'event', exportEvents(collection.scripts))

    return JSON.stringify(ordered(exported, order.collection), null, 2)
}

// ── Import ───────────────────────────────────────────────────────────────

/** A description is a string, or as `{ content, type }`. */
function readDescription(value: unknown): string | undefined {
    if (typeof value === 'string') {
        return value
    }

    if (typeof (value as Json)?.content === 'string') {
        return (value as Json).content
    }

    return undefined
}

function toKeyValue(pair: Json): KeyValue {
    const row: KeyValue = {
        id: newId(),
        key: String(pair.key ?? ''),
        value: pair.value === null || pair.value === undefined ? '' : String(pair.value),
        enabled: !pair.disabled,
    }
    const description = readDescription(pair.description)

    if (description !== undefined) {
        row.description = description
    }

    if (typeof pair.type === 'string') {
        row.type = pair.type
    }

    return row
}

function fromPairs(pairs: unknown): KeyValue[] {
    return Array.isArray(pairs) ? pairs.map(toKeyValue) : []
}

function parseQuery(query: string): KeyValue[] {
    return query
        .split('&')
        .filter(Boolean)
        .map((part) => {
            const [key, ...value] = part.split('=')

            return toKeyValue({
                key,
                value: value.join('='),
            })
        })
}

function scriptText(exec: unknown): string {
    if (Array.isArray(exec)) {
        return exec.join('\n')
    }

    return typeof exec === 'string' ? exec : ''
}

function readScripts(events: unknown): Scripts | undefined {
    if (!Array.isArray(events)) {
        return undefined
    }

    const scripts: Scripts = {}

    for (const event of events as Json[]) {
        const phase = EVENTS.find(({ listen }) => listen === event?.listen)?.phase

        if (!phase) {
            continue
        }

        const exec = event.script?.exec
        const text = scriptText(exec)

        scripts[phase] = scripts[phase] === undefined ? text : `${scripts[phase]}\n${text}`
    }

    return Object.keys(scripts).length > 0 ? scripts : undefined
}

/** Rebuilds a URL from the format's parts, for files that leave out `raw`. */
function joinUrl(url: Json): string {
    const host = Array.isArray(url.host) ? url.host.join('.') : (url.host ?? '')
    const path = Array.isArray(url.path) ? `/${url.path.join('/')}` : ''

    return `${url.protocol ? `${url.protocol}://` : ''}${host}${url.port ? `:${url.port}` : ''}${path}`
}

/** The format keeps the query inside `raw`; Kynova keeps it in the params table. */
function importUrl(url: unknown): Pick<HttpRequest, 'url' | 'params' | 'pathVariables'> {
    if (typeof url === 'string' || !url) {
        const [base, ...query] = String(url ?? '').split('?')

        return {
            url: base,
            params: parseQuery(query.join('?')),
            pathVariables: [],
        }
    }

    const parts = url as Json
    const raw: string = typeof parts.raw === 'string' ? parts.raw : joinUrl(parts)
    const [base, ...query] = raw.split('?')
    const listedParams = fromPairs(parts.query)

    return {
        url: base,
        params: listedParams.length > 0 ? listedParams : parseQuery(query.join('?')),
        pathVariables: fromPairs(parts.variable),
    }
}

/** A collection auth setting: text, a flag, a number, or an OAuth 2.0 parameter table. */
function importAuthValue(value: unknown): AuthValue | undefined {
    if (
        typeof value === 'string' ||
        typeof value === 'boolean' ||
        (typeof value === 'number' && Number.isFinite(value))
    ) {
        return value
    }

    if (!Array.isArray(value)) {
        return undefined
    }

    return value
        .filter((row): row is Json => typeof row === 'object' && row !== null)
        .map((row): AuthParam => ({
            key: String(row.key ?? ''),
            value: String(row.value ?? ''),
            ...(typeof row.enabled === 'boolean' && { enabled: row.enabled }),
            ...(typeof row.send_as === 'string' && { send_as: row.send_as }),
        }))
}

function importAuthValues(fields: unknown): AuthValues {
    const values: AuthValues = {}

    for (const field of Array.isArray(fields) ? fields : []) {
        const value = importAuthValue(field?.value)

        if (typeof field?.key === 'string' && value !== undefined) {
            values[field.key] = value
        }
    }

    return values
}

function importAuth(auth: Json | undefined): Auth {
    if (isSignedAuthType(auth?.type) || auth?.type === 'oauth2') {
        return {
            type: auth!.type,
            values: importAuthValues(auth![auth!.type]),
        }
    }

    const fields = Object.fromEntries(
        fromPairs(auth?.[auth?.type]).map(({ key, value }) => [key, value]),
    )

    switch (auth?.type) {
        case 'bearer':
            return {
                type: 'bearer',
                token: fields.token ?? '',
            }
        case 'basic':
            return {
                type: 'basic',
                username: fields.username ?? '',
                password: fields.password ?? '',
            }
        case 'apikey':
            return {
                type: 'apikey',
                key: fields.key ?? '',
                value: fields.value ?? '',
                addTo: fields.in === 'query' ? 'query' : 'header',
            }
        default:
            return { type: 'none' }
    }
}

function importBody(body: Json | undefined): Body {
    if (body?.mode === 'urlencoded') {
        return {
            type: 'urlencoded',
            fields: fromPairs(body.urlencoded),
        }
    }

    if (body?.mode === 'raw') {
        const language = body.options?.raw?.language

        return {
            type: 'raw',
            language: RAW_LANGUAGES.includes(language) ? language : 'text',
            text: body.raw ?? '',
        }
    }

    return { type: 'none' }
}

function importRequest(request: Json | string): HttpRequest {
    const source: Json = typeof request === 'string' ? { url: request } : request
    const method = String(source.method ?? 'GET').toUpperCase()

    return {
        // Any method token is kept (PROPFIND, PURGE…); one Kynova cannot send becomes GET.
        method: isHttpMethod(method) ? method : 'GET',
        ...importUrl(source.url),
        headers: fromPairs(source.header),
        auth: importAuth(source.auth),
        body: importBody(source.body),
    }
}

/** Description and scripts, set only when the file has them. */
function itemExtras(description: unknown, events: unknown): Pick<Item, 'description' | 'scripts'> {
    const extras: Pick<Item, 'description' | 'scripts'> = {}
    const text = readDescription(description)

    if (text !== undefined) {
        extras.description = text
    }

    const scripts = readScripts(events)

    if (scripts) {
        extras.scripts = scripts
    }

    return extras
}

function importChildren(nodes: unknown, parentId: string): Item[] {
    if (!Array.isArray(nodes)) {
        return []
    }

    return nodes.flatMap((node: Json, order): Item[] => {
        const base = {
            id: newId(),
            parentId,
            name: String(node.name ?? 'Untitled'),
            order,
        }

        if (Array.isArray(node.item)) {
            const folder: Item = {
                ...base,
                kind: 'folder',
                ...itemExtras(node.description, node.event),
            }

            return [folder, ...importChildren(node.item, base.id)]
        }

        if (node.request) {
            // A request's description sits inside `request` in the file, on the item in Kynova.
            const description =
                typeof node.request === 'object' ? node.request.description : undefined
            const item: HttpItem = {
                ...base,
                kind: 'http',
                request: importRequest(node.request),
                ...itemExtras(description, node.event),
            }

            return [item]
        }

        return []
    })
}

/** Adds keys not yet in `order`, each right after the key before it in `keys`. */
function mergeKeyOrder(order: string[] | undefined, keys: string[]): string[] {
    const merged = [...(order ?? [])]

    keys.forEach((key, index) => {
        if (merged.includes(key)) {
            return
        }

        const previous = index === 0 ? -1 : merged.indexOf(keys[index - 1])

        merged.splice(previous + 1, 0, key)
    })

    return merged
}

/**
 * The key order of each kind of object in the file, gathered from all of them
 * (a key only some requests have, like `body`, still gets its place), so an
 * export can write the file the same way.
 */
function readKeyOrder(data: Json): KeyOrder {
    const order: KeyOrder = {
        collection: Object.keys(data),
        info: Object.keys(data.info),
    }
    const visit = (nodes: unknown) => {
        if (!Array.isArray(nodes)) {
            return
        }

        for (const node of nodes as Json[]) {
            if (Array.isArray(node?.item)) {
                order.folder = mergeKeyOrder(order.folder, Object.keys(node))
                visit(node.item)
            } else if (node?.request && typeof node.request === 'object') {
                order.item = mergeKeyOrder(order.item, Object.keys(node))
                order.request = mergeKeyOrder(order.request, Object.keys(node.request))

                if (node.request.url && typeof node.request.url === 'object') {
                    order.url = mergeKeyOrder(order.url, Object.keys(node.request.url))
                }
            }
        }
    }

    visit(data.item)

    return order
}

/**
 * Converts a Collection v2.1 file into items with fresh ids.
 * The collection itself comes first. Throws when the text is not a collection.
 */
export function importCollection(text: string, order: number): Item[] {
    let data: Json

    try {
        data = JSON.parse(text)
    } catch {
        throw new Error('This file is not valid JSON.')
    }

    if (typeof data?.info?.name !== 'string' || !Array.isArray(data.item)) {
        throw new Error('This file is not a Collection v2.1 export.')
    }

    const collection: CollectionItem = {
        id: newId(),
        kind: 'collection',
        parentId: null,
        name: data.info.name,
        order,
        ...itemExtras(data.info.description, data.event),
    }
    const variables = fromPairs(data.variable)

    if (variables.length > 0) {
        collection.variables = variables
    }

    if (typeof data.info[COLLECTION_ID_KEY] === 'string') {
        collection.sourceId = data.info[COLLECTION_ID_KEY]
    }

    collection.keyOrder = readKeyOrder(data)

    return [collection, ...importChildren(data.item, collection.id)]
}
