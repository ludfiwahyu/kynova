import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync, type StatementSync } from 'node:sqlite'

import type { Database, Queryable, Row, SqlValue } from '#server/database/types.ts'

/** SQLite, built into Node: the database is a file inside the app's data directory. */
export function openSqlite(file: string): Database {
    mkdirSync(path.dirname(file), { recursive: true })
    const connection = new DatabaseSync(file)

    connection.exec(
        'PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;',
    )

    const statements = new Map<string, StatementSync>()

    function prepare(sql: string): StatementSync {
        let statement = statements.get(sql)

        if (!statement) {
            statement = connection.prepare(sql)
            statements.set(sql, statement)
        }

        return statement
    }

    const query: Queryable = {
        all: async <T = Row>(sql: string, params: SqlValue[] = []) =>
            prepare(sql).all(...params) as T[],
        get: async <T = Row>(sql: string, params: SqlValue[] = []) =>
            prepare(sql).get(...params) as T | undefined,
        run: async (sql: string, params: SqlValue[] = []) => ({
            changes: Number(prepare(sql).run(...params).changes),
        }),
        exec: async (sql: string) => connection.exec(sql),
    }

    // One connection serves everyone, so transactions run one at a time.
    let lastTransaction: Promise<unknown> = Promise.resolve()

    return {
        engine: 'sqlite',
        ...query,

        transaction<T>(work: (tx: Queryable) => Promise<T>): Promise<T> {
            const result = lastTransaction.then(async () => {
                connection.exec('BEGIN')

                try {
                    const value = await work(query)

                    connection.exec('COMMIT')

                    return value
                } catch (error) {
                    connection.exec('ROLLBACK')
                    throw error
                }
            })

            lastTransaction = result.catch(() => {})

            return result
        },

        // One process owns the file, so there is nobody else to tell.
        notify: async () => {},
        onNotify: () => {},

        close: async () => connection.close(),
    }
}
