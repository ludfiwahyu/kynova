import pg from 'pg'

import type { Database, Queryable, Row, SqlValue } from '#server/database/types.ts'

// BIGINT columns (timestamps) and COUNT(*) arrive as strings by default.
// Every value Kynova stores fits safely in a JavaScript number.
pg.types.setTypeParser(pg.types.builtins.INT8, (value) => Number(value))

/** The channel Kynova servers sharing a database tell each other about changes on. */
const CHANNEL = 'kynova_changes'

export interface PostgresOptions {
    /** The schema Kynova's tables live in. `public` unless set. */
    schema?: string
}

/**
 * Where to connect: a postgres:// URL (DATABASE_URL, read as pg reads it, sslmode included),
 * or connection settings worked out from one (a database picked in the app).
 */
export type PostgresConnection = string | pg.ClientConfig

/** Turns the portable `?` placeholders into PostgreSQL's `$1, $2, ...`. */
function numberPlaceholders(sql: string): string {
    let count = 0

    return sql.replace(/\?/g, () => `$${++count}`)
}

type Run = (sql: string, params?: SqlValue[]) => Promise<pg.QueryResult>

function queryable(run: Run): Queryable {
    return {
        all: async <T = Row>(sql: string, params: SqlValue[] = []) =>
            (await run(numberPlaceholders(sql), params)).rows as T[],
        get: async <T = Row>(sql: string, params: SqlValue[] = []) =>
            (await run(numberPlaceholders(sql), params)).rows[0] as T | undefined,
        run: async (sql: string, params: SqlValue[] = []) => ({
            changes: (await run(numberPlaceholders(sql), params)).rowCount ?? 0,
        }),
        exec: async (sql: string) => {
            await run(sql)
        },
    }
}

export const quoteIdentifier = (name: string) => `"${name.replace(/"/g, '""')}"`

/**
 * CREATE SCHEMA IF NOT EXISTS is not safe against itself: two servers opening a
 * new database at once can both try, and one fails. Already there is fine.
 */
async function createSchema(pool: pg.Pool, schema: string): Promise<void> {
    try {
        await pool.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdentifier(schema)}`)
    } catch (error) {
        const code = (error as { code?: string }).code

        // unique_violation, duplicate_schema
        if (code !== '23505' && code !== '42P06') {
            throw error
        }
    }
}

/** PostgreSQL (Supabase included), as a separate server. */
export async function openPostgres(
    connection: PostgresConnection,
    options: PostgresOptions = {},
): Promise<Database> {
    const { schema = 'public' } = options
    const clientConfig: pg.PoolConfig = {
        ...(typeof connection === 'string' ? { connectionString: connection } : connection),
        connectionTimeoutMillis: 10_000,
    }
    const pool = new pg.Pool(clientConfig)

    // An idle connection the database dropped must not crash the process.
    pool.on('error', (error) => console.error(`PostgreSQL connection lost: ${error.message}`))

    const searchPath = schema === 'public' ? null : `SET search_path TO ${quoteIdentifier(schema)}`
    const prepared = new WeakSet<pg.PoolClient>()

    /** A pooled connection that looks in Kynova's schema; set once, before its first query. */
    async function prepare(): Promise<pg.PoolClient> {
        const client = await pool.connect()

        if (searchPath && !prepared.has(client)) {
            try {
                await client.query(searchPath)
            } catch (error) {
                client.release(error as Error)
                throw error
            }

            prepared.add(client)
        }

        return client
    }

    /** Runs one statement on a prepared connection. */
    async function query(sql: string, params?: SqlValue[]): Promise<pg.QueryResult> {
        const client = await prepare()

        try {
            return await client.query(sql, params)
        } finally {
            client.release()
        }
    }

    // Fail at once with a clear message, not on the first request.
    try {
        if (searchPath) {
            await createSchema(pool, schema)
        }

        await query('SELECT 1')
    } catch (error) {
        await pool.end()
        throw new Error(`Cannot connect to PostgreSQL: ${(error as Error).message}`, {
            cause: error,
        })
    }

    // One extra connection waits for other servers' changes, and reconnects when dropped.
    const handlers: ((payload: string) => void)[] = []
    let listener: pg.Client | null = null
    let closed = false

    async function listen(): Promise<void> {
        if (closed || handlers.length === 0 || listener) {
            return
        }

        const client = new pg.Client(clientConfig)

        listener = client
        client.on('notification', (message) => {
            if (message.payload) {
                handlers.forEach((handler) => handler(message.payload!))
            }
        })
        client.on('error', () => {
            listener = null
            client.end().catch(() => {})

            if (!closed) {
                setTimeout(() => void listen().catch(() => {}), 2000).unref()
            }
        })
        await client.connect()
        await client.query(`LISTEN ${CHANNEL}`)
    }

    return {
        engine: 'postgres',
        ...queryable(query),

        async transaction<T>(work: (tx: Queryable) => Promise<T>): Promise<T> {
            const client = await prepare()

            try {
                await client.query('BEGIN')
                const value = await work(queryable((sql, params) => client.query(sql, params)))

                await client.query('COMMIT')

                return value
            } catch (error) {
                await client.query('ROLLBACK')
                throw error
            } finally {
                client.release()
            }
        },

        async notify(payload: string): Promise<void> {
            await query('SELECT pg_notify($1, $2)', [CHANNEL, payload])
        },

        onNotify(handler: (payload: string) => void): void {
            handlers.push(handler)
            listen().catch((error) => {
                listener = null
                console.error(`Live sync with other servers is off: ${(error as Error).message}`)
            })
        },

        async close(): Promise<void> {
            closed = true
            await listener?.end().catch(() => {})
            await pool.end()
        },
    }
}
