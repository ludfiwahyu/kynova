import { isSignedAuthType } from '#shared/auth.ts'
import { MAX_NAME_LENGTH } from '#shared/limits.ts'
import { isHttpMethod } from '#shared/methods.ts'
import { type Entity, HEX_COLOR, TAG_COLORS } from '#shared/types.ts'

const ENTITIES: readonly Entity[] = ['items', 'environments', 'comments', 'settings', 'archive']
const OPTIONAL_PANELS = ['environments', 'history']
const RAW_LANGUAGES = ['json', 'text', 'xml', 'html', 'javascript']
const MAX_ID_LENGTH = 100
/** Descriptions and scripts are free text; the 2 MB message limit bounds them further. */
const MAX_TEXT_LENGTH = 500_000

type Json = Record<string, unknown>

function isRecord(value: unknown): value is Json {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const isString = (value: unknown): value is string => typeof value === 'string'

export function isId(value: unknown): value is string {
    return isString(value) && value.length > 0 && value.length <= MAX_ID_LENGTH
}

function isName(value: unknown): boolean {
    return isString(value) && value.length <= MAX_NAME_LENGTH
}

/** True for an absent value, or a string within the text limit. */
function isOptionalText(value: unknown): boolean {
    return value === undefined || (isString(value) && value.length <= MAX_TEXT_LENGTH)
}

/** True for an absent colour tag, or one of the known colours. */
function isOptionalTagColor(value: unknown): boolean {
    return (
        value === undefined ||
        TAG_COLORS.some((color) => color === value) ||
        (isString(value) && HEX_COLOR.test(value))
    )
}

export function isEntity(value: unknown): value is Entity {
    return ENTITIES.includes(value as Entity)
}

function isKeyValueList(value: unknown): boolean {
    return (
        Array.isArray(value) &&
        value.every(
            (row) =>
                isRecord(row) &&
                isId(row.id) &&
                isString(row.key) &&
                isString(row.value) &&
                typeof row.enabled === 'boolean' &&
                isOptionalText(row.description) &&
                (row.type === undefined ||
                    (isString(row.type) && row.type.length <= MAX_NAME_LENGTH)),
        )
    )
}

function isOptionalKeyValueList(value: unknown): boolean {
    return value === undefined || isKeyValueList(value)
}

/** A short list of short key names per object kind. */
function isKeyOrder(value: unknown): boolean {
    if (value === undefined) {
        return true
    }

    if (!isRecord(value)) {
        return false
    }

    return Object.values(value).every(
        (keys) =>
            Array.isArray(keys) &&
            keys.length <= 40 &&
            keys.every((key) => isString(key) && key.length <= 60),
    )
}

function isScripts(value: unknown): boolean {
    return (
        value === undefined ||
        (isRecord(value) && isOptionalText(value.preRequest) && isOptionalText(value.test))
    )
}

/** One OAuth 2.0 extra-parameter row. */
function isAuthParam(row: unknown): boolean {
    return (
        isRecord(row) &&
        isString(row.key) &&
        isString(row.value) &&
        (row.enabled === undefined || typeof row.enabled === 'boolean') &&
        (row.send_as === undefined || isName(row.send_as))
    )
}

/** Settings of the signed auth types and OAuth 2.0, under the collection format's key names. */
function isAuthValues(values: unknown): boolean {
    if (!isRecord(values)) {
        return false
    }

    const entries = Object.entries(values)

    return (
        entries.length <= 60 &&
        entries.every(
            ([key, value]) =>
                key.length <= 60 &&
                (typeof value === 'boolean' ||
                    (typeof value === 'number' && Number.isFinite(value)) ||
                    (isString(value) && value.length <= MAX_TEXT_LENGTH) ||
                    (Array.isArray(value) && value.length <= 100 && value.every(isAuthParam))),
        )
    )
}

function isAuth(auth: unknown): boolean {
    if (!isRecord(auth)) {
        return false
    }

    switch (auth.type) {
        case 'none':
            return true
        case 'bearer':
            return isString(auth.token)
        case 'basic':
            return isString(auth.username) && isString(auth.password)
        case 'apikey':
            return (
                isString(auth.key) &&
                isString(auth.value) &&
                (auth.addTo === 'header' || auth.addTo === 'query')
            )
        default:
            return (
                (isSignedAuthType(auth.type) || auth.type === 'oauth2') && isAuthValues(auth.values)
            )
    }
}

function isBody(body: unknown): boolean {
    if (!isRecord(body)) {
        return false
    }

    switch (body.type) {
        case 'none':
            return true
        case 'raw':
            return RAW_LANGUAGES.includes(body.language as string) && isString(body.text)
        case 'urlencoded':
            return isKeyValueList(body.fields)
        default:
            return false
    }
}

function isHttpRequest(request: unknown): boolean {
    return (
        isRecord(request) &&
        isHttpMethod(request.method) &&
        isString(request.url) &&
        isKeyValueList(request.params) &&
        isKeyValueList(request.headers) &&
        isAuth(request.auth) &&
        isBody(request.body) &&
        isOptionalKeyValueList(request.pathVariables)
    )
}

/** Checks one item's own fields. Where it sits in the tree is checked against storage. */
export function isValidItem(doc: unknown): boolean {
    if (!isRecord(doc) || !isId(doc.id) || !isName(doc.name) || !Number.isFinite(doc.order)) {
        return false
    }

    if (
        !isOptionalText(doc.description) ||
        !isScripts(doc.scripts) ||
        !isOptionalTagColor(doc.color) ||
        !(doc.savedBy === undefined || isName(doc.savedBy)) ||
        !(doc.savedAt === undefined || Number.isFinite(doc.savedAt))
    ) {
        return false
    }

    switch (doc.kind) {
        case 'collection':
            return (
                doc.parentId === null &&
                isOptionalKeyValueList(doc.variables) &&
                (doc.sourceId === undefined || isId(doc.sourceId)) &&
                isKeyOrder(doc.keyOrder)
            )
        case 'folder':
            return isId(doc.parentId)
        case 'http':
            return isId(doc.parentId) && isHttpRequest(doc.request)
        case 'websocket':
            return isId(doc.parentId) && isString(doc.url)
        default:
            return false
    }
}

export function isValidSettings(doc: unknown): boolean {
    if (!isRecord(doc) || doc.id !== 'workspace') {
        return false
    }

    const { panels, accentColor, theme } = doc
    const panelsOk =
        panels === undefined ||
        (isRecord(panels) &&
            Object.entries(panels).every(
                ([key, value]) => OPTIONAL_PANELS.includes(key) && typeof value === 'boolean',
            ))
    const accentOk =
        accentColor === undefined || (isString(accentColor) && /^#[0-9a-f]{6}$/i.test(accentColor))
    const themeOk = theme === undefined || theme === 'light' || theme === 'dark'

    return panelsOk && accentOk && themeOk
}

export function isValidEnvironment(doc: unknown): boolean {
    return (
        isRecord(doc) &&
        isId(doc.id) &&
        isName(doc.name) &&
        isKeyValueList(doc.variables) &&
        isOptionalTagColor(doc.color)
    )
}
