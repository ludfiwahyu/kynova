/** Helpers the database scripts share for working with SQLite database files directly. */
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

import { config } from '#server/config.ts'

export const KYNOVA_TABLES = ['users', 'sessions', 'workspaces', 'members', 'invites', 'docs']

export function fail(message: string): never {
    console.error(message)
    process.exit(1)
}

/** Backup and restore work on the SQLite file; PostgreSQL has its own tools. */
export function requireSqlite(): void {
    if (config.databaseUrl) {
        fail(
            'DATABASE_URL points to PostgreSQL. Back it up with pg_dump and restore it with pg_restore or psql.',
        )
    }
}

/** 2026-11-12T09:30:05.123Z -> 2026-11-12-093005 */
export function timestamp(): string {
    return new Date().toISOString().slice(0, 19).replace('T', '-').replaceAll(':', '')
}

/** Opens a database file for reading only, so nothing here can change it or run migrations on it. */
export function openReadOnly(file: string): DatabaseSync {
    return new DatabaseSync(file, { readOnly: true })
}

/** The highest migration version the file has run; 0 when it predates migrations. */
export function schemaVersionOf(database: DatabaseSync): number {
    const table = database
        .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'")
        .get()

    if (!table) {
        return 0
    }

    const row = database.prepare('SELECT MAX(version) AS version FROM schema_migrations').get()

    return Number(row?.version ?? 0)
}

/** Copies `source` into a new file at `target`, including changes still in the write-ahead log. */
export function copyDatabase(source: string, target: string): void {
    mkdirSync(path.dirname(target), { recursive: true })
    const database = openReadOnly(source)

    try {
        database.prepare('VACUUM INTO ?').run(target)
    } finally {
        database.close()
    }
}
