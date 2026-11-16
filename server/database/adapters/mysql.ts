import mysql from 'mysql2/promise'

import type { Database, Queryable, Row, SqlValue } from '#server/database/types.ts'

const ANSI_QUOTES = "SET SESSION sql_mode = CONCAT(@@SESSION.sql_mode, ',ANSI_QUOTES')"

/** Turns the portable upserts into MySQL's own words. Other SQL comes back unchanged. */
export function toMysql(sql: string): string {
    const doNothing = /\s*ON CONFLICT\s*\([^)]*\)\s*DO NOTHING/i

    if (doNothing.test(sql)) {
        return sql.replace(doNothing, '').replace(/^\s*INSERT\s+INTO/i, 'INSERT IGNORE INTO')
    }

    // The row alias `excluded` lets the SET clause read the new values, as in PostgreSQL.
    return sql.replace(
        /ON CONFLICT\s*\([^)]*\)\s*DO UPDATE SET/i,
        'AS excluded ON DUPLICATE KEY UPDATE',
    )
}

/** Splits a migration file into statements: MySQL runs one statement per call. */
export function splitStatements(sql: string): string[] {
    return sql
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .split(/;\s*(?:\n|$)/)
        .map((statement) => statement.trim())
        .filter(Boolean)
}

type Connection = mysql.PoolConnection

function queryable(
    connection: () => Promise<Connection>,
    release: (c: Connection) => void,
): Queryable {
    async function run(sql: string, params: SqlValue[] = []) {
        const conn = await connection()

        try {
            const [result] = await conn.query(toMysql(sql), params)

            return result
        } finally {
            release(conn)
        }
    }

    return {
        all: async <T = Row>(sql: string, params?: SqlValue[]) => (await run(sql, params)) as T[],

        get: async <T = Row>(sql: string, params?: SqlValue[]) =>
            ((await run(sql, params)) as T[])[0],

        run: async (sql: string, params?: SqlValue[]) => ({
            changes: ((await run(sql, params)) as mysql.ResultSetHeader).affectedRows,
        }),

        exec: async (sql: string) => {
            for (const statement of splitStatements(sql)) {
                await run(statement)
            }
        },
    }
}

/** Opens a mysql:// URL, such as DATABASE_URL=mysql://user:password@host:3306/kynova. */
export async function openMysql(url: string): Promise<Database> {
    const pool = mysql.createPool({
        uri: url,
        connectionLimit: 10,
        connectTimeout: 10_000,
    })
    const prepared = new WeakSet<Connection>()

    /** A pooled connection with ANSI_QUOTES on; set once, before its first query. */
    async function prepare(): Promise<Connection> {
        const conn = await pool.getConnection()

        if (!prepared.has(conn)) {
            await conn.query(ANSI_QUOTES)
            prepared.add(conn)
        }

        return conn
    }

    // Fail at once with a clear message, not on the first request.
    try {
        const conn = await prepare()

        conn.release()
    } catch (error) {
        await pool.end()
        throw new Error(`Cannot connect to MySQL: ${(error as Error).message}`, { cause: error })
    }

    return {
        engine: 'mysql',
        ...queryable(prepare, (conn) => conn.release()),

        async transaction<T>(work: (tx: Queryable) => Promise<T>): Promise<T> {
            const conn = await prepare()

            try {
                await conn.beginTransaction()

                // Inside the transaction every statement uses this one connection.
                const value = await work(
                    queryable(
                        async () => conn,
                        () => {},
                    ),
                )

                await conn.commit()

                return value
            } catch (error) {
                await conn.rollback()
                throw error
            } finally {
                conn.release()
            }
        },

        // One server per MySQL database: there is nobody else to tell.
        async notify() {},
        onNotify() {},

        async close() {
            await pool.end()
        },
    }
}
