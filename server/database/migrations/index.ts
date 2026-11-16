import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import type { Database, Queryable } from '#server/database/types.ts'

export type Engine = Database['engine']

export interface Migration {
    version: number
    /** From the file name: `0002_index_lookups_by_user.sql` is "index lookups by user". */
    name: string
    sql: string
}

export const ENGINES: Engine[] = ['sqlite', 'postgres', 'mysql']

/** Kynova's tables. A new table belongs here too, so backups and copies include it. */
export const TABLES = ['users', 'sessions', 'workspaces', 'members', 'invites', 'docs', 'schema_migrations']

/** Any fixed number: servers starting together on one database take turns migrating it. */
const MIGRATION_LOCK = 6_407_221

const FOLDER = fileURLToPath(new URL('.', import.meta.url))

/** The migrations of one engine, oldest first. */
export function migrationsFor(engine: Engine): Migration[] {
    const folder = `${FOLDER}${engine}/`

    return readdirSync(folder)
        .filter((file) => /^\d{4}_.+\.sql$/.test(file))
        .sort()
        .map((file) => ({
            version: Number(file.slice(0, 4)),
            name: file.slice(5, -4).replace(/_/g, ' '),
            sql: readFileSync(folder + file, 'utf8'),
        }))
}

export const LATEST_VERSION = migrationsFor('sqlite').at(-1)!.version

const SCHEMA_MIGRATIONS_TABLE: Record<Engine, string> = {
    sqlite: `
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version    INTEGER PRIMARY KEY,
            name       TEXT NOT NULL,
            applied_at BIGINT NOT NULL
        )`,
    postgres: `
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version    INTEGER PRIMARY KEY,
            name       TEXT NOT NULL,
            applied_at BIGINT NOT NULL
        )`,
    mysql: `
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version    INT NOT NULL PRIMARY KEY,
            name       VARCHAR(255) NOT NULL,
            applied_at BIGINT NOT NULL
        ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_bin`,
}

/** The highest migration version this database has run; 0 for a new database. */
export async function schemaVersion(db: Queryable): Promise<number> {
    const row = await db.get<{ version: number | null }>(
        'SELECT MAX(version) AS version FROM schema_migrations',
    )

    return row?.version ?? 0
}

/**
 * Waits for any other server migrating the same database, then runs `work`.
 * SQLite has one server per file, so it needs no turn.
 */
async function inTurn<T>(db: Database, work: (tx: Queryable) => Promise<T>): Promise<T> {
    return db.transaction(async (tx) => {
        if (db.engine === 'postgres') {
            // Released at commit.
            await tx.exec(`SELECT pg_advisory_xact_lock(${MIGRATION_LOCK})`)
        }

        if (db.engine === 'mysql') {
            // A MySQL lock belongs to the connection, so it is released by hand.
            await tx.get(`SELECT GET_LOCK('kynova_${MIGRATION_LOCK}', 60) AS locked`)

            try {
                return await work(tx)
            } finally {
                await tx.get(`SELECT RELEASE_LOCK('kynova_${MIGRATION_LOCK}') AS released`)
            }
        }

        return work(tx)
    })
}

/**
 * Brings the database up to `LATEST_VERSION`, one migration per transaction.
 * Several servers may start on one database at once: each migration runs once,
 * by whichever server gets to it first.
 *
 * On MySQL a structure change commits by itself, so a migration that fails halfway
 * is not undone there: fix the cause and start again.
 */
export async function migrate(db: Database): Promise<void> {
    await inTurn(db, (tx) => tx.exec(SCHEMA_MIGRATIONS_TABLE[db.engine]))

    const current = await schemaVersion(db)

    if (current > LATEST_VERSION) {
        throw new Error(
            `The database is at schema version ${current}, but this version of Kynova knows only up to ` +
                `${LATEST_VERSION}. Run a newer version of Kynova, or restore a backup made by this one.`,
        )
    }

    for (const migration of migrationsFor(db.engine)) {
        if (migration.version <= current) {
            continue
        }

        try {
            const ran = await inTurn(db, async (tx) => {
                // Another server may have run it while this one waited.
                const done = await tx.get('SELECT 1 AS done FROM schema_migrations WHERE version = ?', [
                    migration.version,
                ])

                if (done) {
                    return false
                }

                await tx.exec(migration.sql)
                await tx.run('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)', [
                    migration.version,
                    migration.name,
                    Date.now(),
                ])

                return true
            })

            if (ran) {
                console.log(`Database migrated to version ${migration.version}: ${migration.name}`)
            }
        } catch (error) {
            throw new Error(
                `Database migration ${migration.version} (${migration.name}) failed: ${(error as Error).message}`,
                { cause: error },
            )
        }
    }
}
