import { existsSync } from 'node:fs'

import { config } from '#server/config.ts'
import { LATEST_VERSION, migrate } from '#server/database/migrations/index.ts'
import type { SqlValue } from '#server/database/types.ts'

import { openCliTarget } from './cliTarget.ts'
import { fail, openReadOnly, schemaVersionOf } from './sqliteFile.ts'

/** Parents before children, so every foreign key points at a row already copied. */
const TABLES: {
    name: string
    columns: string[]
}[] = [
    {
        name: 'users',
        columns: ['id', 'email', 'name', 'color', 'password_hash', 'created_at'],
    },
    {
        name: 'workspaces',
        columns: ['id', 'name', 'created_at'],
    },
    {
        name: 'members',
        columns: ['workspace_id', 'user_id', 'role'],
    },
    {
        name: 'sessions',
        columns: ['token_hash', 'user_id', 'expires_at'],
    },
    {
        name: 'invites',
        columns: ['token', 'workspace_id', 'role', 'expires_at'],
    },
    {
        name: 'docs',
        columns: ['workspace_id', 'entity', 'id', 'data'],
    },
]

const USAGE =
    'Name the database: npm run db:copy-to-postgres -- postgresql://user:password@host:5432/kynova [--schema public|kynova] [--ssl verify|require|off] [--ca <file>], or npm run db:copy-to-mysql -- mysql://user:password@host:3306/kynova'
const args = process.argv.slice(2)

if (args.length === 0 && config.databaseUrl) {
    args.push(config.databaseUrl)
}

if (!existsSync(config.databaseFile)) {
    fail(`There is no SQLite database at ${config.databaseFile} to copy.`)
}

const source = openReadOnly(config.databaseFile)
const sourceVersion = schemaVersionOf(source)

if (sourceVersion < LATEST_VERSION) {
    fail(
        `The SQLite database is at schema version ${sourceVersion}. Start the server once to update it, then copy.`,
    )
}

const { db: target, description, schema } = await openCliTarget(args, USAGE, 'public')

try {
    await migrate(target)

    const existing = await target.get<{ count: number }>('SELECT COUNT(*) AS count FROM users')

    if (existing && existing.count > 0) {
        fail('That database already has users. Copy only into an empty database.')
    }

    await target.transaction(async (tx) => {
        for (const { name, columns } of TABLES) {
            const rows = source.prepare(`SELECT ${columns.join(', ')} FROM ${name}`).all()
            const placeholders = columns.map(() => '?').join(', ')
            const insert = `INSERT INTO ${name} (${columns.join(', ')}) VALUES (${placeholders})`

            for (const row of rows) {
                await tx.run(
                    insert,
                    columns.map((column) => row[column] as SqlValue),
                )
            }

            console.log(`Copied ${rows.length} ${name}.`)
        }
    })

    console.log(
        schema === 'public' || schema === ''
            ? `Done: copied into ${description}. Start the server with DATABASE_URL set to the same URL.`
            : `Done: copied into ${description}. Pick it in Kynova's database settings to use it.`,
    )
} finally {
    source.close()
    await target.close()
}
