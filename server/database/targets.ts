import { createHmac, randomBytes } from 'node:crypto'
import { lookup } from 'node:dns/promises'
import { chmodSync, existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import type { IncomingMessage } from 'node:http'
import path from 'node:path'

import type pg from 'pg'

import { config } from '#server/config.ts'
import { HttpError } from '#server/http/router.ts'
import { isPrivateAddress } from '#server/services/proxy/proxy.ts'
import { isSupabaseHost, type SslMode } from '#shared/databaseUrl.ts'
import { STATUS } from '#shared/http.ts'
import { DATABASE_URL } from '#shared/patterns.ts'
import { POSTGRES_PORT, SUPABASE_POOLER_PORT } from '#shared/ports.ts'

import { openMysql } from './adapters/mysql.ts'
import { openPostgres } from './adapters/postgres.ts'
import { openSqlite } from './adapters/sqlite.ts'
import type { Target, TargetKind } from './context.ts'
import { migrate } from './migrations/index.ts'

export const LOCAL_ID = 'local'
export const TARGET_COOKIE = 'kynova_db'
/** Picked databases keep Kynova's tables apart from anything else in them, and out of Supabase's public API. */
export const EXTERNAL_SCHEMA = 'kynova'
/** Supabase's transaction pooler: no session state, so no search_path and no LISTEN for live sync. */
const SUPABASE_TRANSACTION_POOLER_PORT = String(SUPABASE_POOLER_PORT)

export type { SslMode } from '#shared/databaseUrl.ts'

/** What someone types to connect to their own database. */
export interface TargetInput {
    url: string
    ssl: SslMode
    /** A CA certificate (PEM) to verify the server against, such as Supabase's. */
    ca?: string
}

interface SavedTarget extends TargetInput {
    id: string
}

const TARGETS_FILE = path.join(config.dataDir, 'targets.json')
const SECRET_FILE = path.join(config.dataDir, 'targets.secret')

/** Owner read and write only: the file holds database passwords. */
function writePrivate(file: string, content: string): void {
    const temporary = `${file}.${process.pid}.tmp`

    writeFileSync(temporary, content, { mode: 0o600 })
    renameSync(temporary, file)
    chmodSync(file, 0o600)
}

/** Makes target ids unguessable, so an id is no use without having had the connection details. */
function secret(): string {
    if (!existsSync(SECRET_FILE)) {
        writePrivate(SECRET_FILE, randomBytes(32).toString('hex'))
    }

    return readFileSync(SECRET_FILE, 'utf8').trim()
}

function savedTargets(): SavedTarget[] {
    if (!existsSync(TARGETS_FILE)) {
        return []
    }

    try {
        return JSON.parse(readFileSync(TARGETS_FILE, 'utf8'))
    } catch {
        return []
    }
}

function save(target: SavedTarget): void {
    const others = savedTargets().filter(({ id }) => id !== target.id)

    writePrivate(TARGETS_FILE, JSON.stringify([...others, target], null, 2))
}

// ── Reading connection details ───────────────────────────────────────────

interface Parsed {
    kind: Exclude<TargetKind, 'local'>
    label: string
    detail: string
    host: string
    connection: pg.ClientConfig
}

/** The connection string, read into settings. Every problem comes back as a message to show. */
export function parseTarget(input: TargetInput): Parsed {
    let url: URL

    try {
        url = new URL(input.url.trim())
    } catch {
        throw new HttpError(
            STATUS.badRequest,
            'Paste a connection string such as postgresql://user:password@host:5432/postgres.',
        )
    }

    if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') {
        throw new HttpError(
            STATUS.badRequest,
            'The connection string must start with postgresql:// or postgres://.',
        )
    }

    const host = url.hostname.replace(/^\[|\]$/g, '')

    if (!host) {
        throw new HttpError(STATUS.badRequest, 'The connection string has no host.')
    }

    if (!['verify', 'require', 'off'].includes(input.ssl)) {
        throw new HttpError(STATUS.badRequest, 'Choose how to use SSL.')
    }

    const supabase = isSupabaseHost(host)

    if (supabase && url.port === SUPABASE_TRANSACTION_POOLER_PORT) {
        throw new HttpError(
            STATUS.badRequest,
            'Port 6543 is Supabase’s transaction pooler, which Kynova cannot use for live sync. Use the session pooler (port 5432) or the direct connection.',
        )
    }

    if (supabase && input.ssl === 'off') {
        throw new HttpError(
            STATUS.badRequest,
            'Supabase accepts only SSL connections. Choose Require or Verify.',
        )
    }

    const user = decodeURIComponent(url.username)
    const database = decodeURIComponent(url.pathname.slice(1)) || 'postgres'
    const port = Number(url.port || POSTGRES_PORT)
    // The direct host is db.<ref>.supabase.co; the poolers take the ref in the user name (postgres.<ref>).
    const project =
        host.match(/^db\.([a-z0-9]+)\.supabase\.co$/i)?.[1] ??
        user.match(/^postgres\.([a-z0-9]+)$/i)?.[1]

    let ssl: pg.ClientConfig['ssl'] = {
        rejectUnauthorized: true,
        servername: host,
        ...(input.ca?.trim() && { ca: input.ca.trim() }),
    }

    if (input.ssl === 'off') {
        ssl = false
    } else if (input.ssl === 'require') {
        ssl = { rejectUnauthorized: false }
    }

    return {
        kind: supabase ? 'supabase' : 'postgres',
        label: supabase ? 'Supabase' : 'PostgreSQL',
        detail: supabase
            ? (project ?? host)
            : `${host}${port === POSTGRES_PORT ? '' : `:${port}`}/${database}`,
        host,
        connection: {
            host,
            port,
            user,
            password: decodeURIComponent(url.password),
            database,
            ssl,
        },
    }
}

/**
 * Where to connect. A server shared over the network must not be steered at
 * machines on its own network, as with the request proxy; so the name is looked
 * up once, checked, and that address is what gets connected to.
 */
async function resolveConnection(parsed: Parsed): Promise<pg.ClientConfig> {
    if (config.allowPrivateTargets) {
        return parsed.connection
    }

    let addresses: { address: string }[]

    try {
        addresses = await lookup(parsed.host, { all: true })
    } catch {
        throw new HttpError(STATUS.badRequest, `Cannot find the host ${parsed.host}.`)
    }

    if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
        throw new HttpError(
            STATUS.forbidden,
            'This server does not connect to databases on private network addresses.',
        )
    }

    return {
        ...parsed.connection,
        host: addresses[0].address,
    }
}

function targetId(input: TargetInput): string {
    const canonical = JSON.stringify([input.url.trim(), input.ssl, input.ca?.trim() ?? ''])

    return createHmac('sha256', secret()).update(canonical).digest('hex').slice(0, 32)
}

const friendly = (error: unknown) =>
    error instanceof HttpError
        ? error
        : new HttpError(
              STATUS.badGateway,
              (error as Error).message.replace(
                  /^Cannot connect to PostgreSQL: /,
                  'Cannot connect: ',
              ),
          )

// ── Opening ──────────────────────────────────────────────────────────────

/** Open databases by id. A database is opened once, however many people use it. */
const open = new Map<string, Promise<Target>>()
const openedListeners: ((target: Target) => void)[] = []

/** Runs `listener` for each database as it opens (live sync subscribes to other servers here). */
export function whenTargetOpens(listener: (target: Target) => void): void {
    openedListeners.push(listener)
}

function opening(id: string, start: () => Promise<Target>): Promise<Target> {
    let target = open.get(id)

    if (!target) {
        target = start().then(async (opened) => {
            await migrate(opened.db)
            openedListeners.forEach((listener) => listener(opened))

            return opened
        })
        // A failure is not kept: the next attempt tries again.
        target.catch(() => open.delete(id))
        open.set(id, target)
    }

    return target
}

/** This server's own database: SQLite in the data directory, or DATABASE_URL when set. */
export function localTarget(): Promise<Target> {
    return opening(LOCAL_ID, async () => {
        if (!config.databaseUrl) {
            return {
                id: LOCAL_ID,
                kind: 'local',
                label: 'Local database',
                detail: 'SQLite on this server',
                db: await openSqlite(config.databaseFile),
            }
        }

        if (DATABASE_URL.mysql.test(config.databaseUrl)) {
            return {
                id: LOCAL_ID,
                kind: 'local',
                label: 'Local database',
                detail: 'MySQL set by the server',
                db: await openMysql(config.databaseUrl),
            }
        }

        if (!DATABASE_URL.postgres.test(config.databaseUrl)) {
            throw new Error(
                'DATABASE_URL must be a postgres:// or mysql:// URL. Leave it unset to use the built-in SQLite database.',
            )
        }

        return {
            id: LOCAL_ID,
            kind: 'local',
            label: 'Local database',
            detail: 'PostgreSQL set by the server',
            db: await openPostgres(config.databaseUrl),
        }
    })
}

function openExternal(id: string, input: TargetInput): Promise<Target> {
    return opening(id, async () => {
        const parsed = parseTarget(input)
        const db = await openPostgres(await resolveConnection(parsed), { schema: EXTERNAL_SCHEMA })

        return {
            id,
            kind: parsed.kind,
            label: parsed.label,
            detail: parsed.detail,
            db,
        }
    })
}

/** Connects to someone's own database, prepares its tables, and remembers it. */
export async function connectTarget(input: TargetInput): Promise<Target> {
    parseTarget(input)
    const id = targetId(input)

    try {
        const target = await openExternal(id, input)

        save({
            id,
            url: input.url.trim(),
            ssl: input.ssl,
            ...(input.ca?.trim() && { ca: input.ca.trim() }),
        })

        return target
    } catch (error) {
        throw friendly(error)
    }
}

/** Tries the connection without changing anything in the database. */
export async function testTarget(input: TargetInput): Promise<{
    kind: TargetKind
    label: string
    detail: string
    version: string
}> {
    const parsed = parseTarget(input)

    try {
        const db = await openPostgres(await resolveConnection(parsed))

        try {
            const row = await db.get<{ version: string }>(
                "SELECT current_setting('server_version') AS version",
            )

            return {
                kind: parsed.kind,
                label: parsed.label,
                detail: parsed.detail,
                version: row?.version ?? '',
            }
        } finally {
            await db.close()
        }
    } catch (error) {
        throw friendly(error)
    }
}

function serverDatabaseDetail(): string {
    if (!config.databaseUrl) {
        return 'SQLite on this server'
    }

    if (config.databaseUrl.startsWith('mysql:')) {
        return 'MySQL set by the server'
    }

    return 'PostgreSQL set by the server'
}

/** What a target id stands for, without connecting: for showing a database that cannot be reached. */
export function describeTarget(id: string): Omit<Target, 'db'> {
    const saved = id === LOCAL_ID ? undefined : savedTargets().find((target) => target.id === id)

    if (!saved) {
        return {
            id: LOCAL_ID,
            kind: 'local',
            label: 'Local database',
            detail: serverDatabaseDetail(),
        }
    }

    const { kind, label, detail } = parseTarget(saved)

    return {
        id,
        kind,
        label,
        detail,
    }
}

/** The database a target id stands for: local, or one picked earlier and saved. Null when unknown. */
export function targetById(id: string): Promise<Target> | null {
    if (id === LOCAL_ID) {
        return localTarget()
    }

    const saved = savedTargets().find((target) => target.id === id)

    return saved ? openExternal(saved.id, saved) : null
}

export function readTargetCookie(req: IncomingMessage): string {
    for (const part of req.headers.cookie?.split(';') ?? []) {
        const [name, value] = part.trim().split('=')

        if (name === TARGET_COOKIE && /^[a-z0-9]{1,64}$/.test(value ?? '')) {
            return value
        }
    }

    return LOCAL_ID
}

/** The database this request's person picked; the local one when they never picked or it was forgotten. */
export async function requestTarget(req: IncomingMessage): Promise<Target> {
    const pending = targetById(readTargetCookie(req)) ?? localTarget()

    try {
        return await pending
    } catch (error) {
        throw new HttpError(
            503,
            `Cannot reach your database. ${friendly(error).message} Choose another database to continue.`,
        )
    }
}

export function targetCookie(id: string): string {
    const secure = config.secureCookie ? '; Secure' : ''

    return `${TARGET_COOKIE}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${365 * 24 * 60 * 60}${secure}`
}

/** Databases open right now, for housekeeping such as removing expired sessions. */
export async function openTargets(): Promise<Target[]> {
    const settled = await Promise.allSettled(open.values())

    return settled.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
}
