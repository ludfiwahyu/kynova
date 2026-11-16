import { copyFileSync, existsSync, rmSync } from 'node:fs'
import { connect } from 'node:net'
import path from 'node:path'

import { config } from '#server/config.ts'
import { LATEST_VERSION } from '#server/database/migrations/index.ts'

import {
    copyDatabase,
    fail,
    KYNOVA_TABLES,
    openReadOnly,
    requireSqlite,
    schemaVersionOf,
    timestamp,
} from './sqliteFile.ts'

/** True when something answers on the server's port, which most likely is the server. */
function isServerRunning(): Promise<boolean> {
    const host = config.host === '0.0.0.0' || config.host === '::' ? '127.0.0.1' : config.host

    return new Promise((resolve) => {
        const socket = connect({
            host,
            port: config.port,
            timeout: 1000,
        })

        socket.once('connect', () => {
            socket.destroy()
            resolve(true)
        })
        socket.once('error', () => resolve(false))
        socket.once('timeout', () => {
            socket.destroy()
            resolve(false)
        })
    })
}

/** Checks that the file is a Kynova database this version can open, and returns its schema version. */
function checkBackup(file: string): number {
    let version: number
    let missing: string[]

    try {
        const backup = openReadOnly(file)
        const tables = backup
            .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
            .all()
            .map((row) => row.name)

        missing = KYNOVA_TABLES.filter((table) => !tables.includes(table))
        version = schemaVersionOf(backup)
        backup.close()
    } catch (error) {
        fail(`${file} cannot be read as a database: ${(error as Error).message}`)
    }

    if (missing.length > 0) {
        fail(`${file} is not a Kynova database: it has no ${missing.join(', ')} table.`)
    }

    if (version > LATEST_VERSION) {
        fail(
            `${file} was made by a newer version of Kynova (schema ${version}); this one knows up to ${LATEST_VERSION}.`,
        )
    }

    return version
}

requireSqlite()

const source = process.argv[2]

if (!source) {
    fail('Name the backup to restore: npm run db:restore -- <backup file>')
}

const backupFile = path.resolve(source)

if (!existsSync(backupFile)) {
    fail(`${backupFile} does not exist.`)
}

if (backupFile === config.databaseFile) {
    fail('That is the current database, not a backup.')
}

if (await isServerRunning()) {
    fail(
        `Something is answering on port ${config.port}. Stop the Kynova server before restoring.`,
    )
}

const version = checkBackup(backupFile)

if (existsSync(config.databaseFile)) {
    const safetyCopy = path.join(config.backupDir, `before-restore-${timestamp()}.db`)

    copyDatabase(config.databaseFile, safetyCopy)
    console.log(`The current database was saved to ${safetyCopy}.`)
}

// The write-ahead log belongs to the database being replaced; left behind, it would be replayed onto the backup.
for (const suffix of ['', '-wal', '-shm']) {
    rmSync(config.databaseFile + suffix, { force: true })
}

copyFileSync(backupFile, config.databaseFile)

const upgrade =
    version < LATEST_VERSION
        ? ` The server will migrate it to version ${LATEST_VERSION} when it starts.`
        : ''

console.log(`Restored ${backupFile} (schema version ${version}).${upgrade}`)
