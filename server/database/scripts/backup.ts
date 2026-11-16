import { existsSync, statSync } from 'node:fs'
import path from 'node:path'

import { config } from '#server/config.ts'
import { KB } from '#shared/units.ts'

import {
    copyDatabase,
    fail,
    openReadOnly,
    requireSqlite,
    schemaVersionOf,
    timestamp,
} from './sqliteFile.ts'

requireSqlite()

if (!existsSync(config.databaseFile)) {
    fail(`There is no database at ${config.databaseFile} to back up.`)
}

const target = path.resolve(
    process.argv[2] ?? path.join(config.backupDir, `kynova-${timestamp()}.db`),
)

if (existsSync(target)) {
    fail(`${target} already exists. Choose another file name.`)
}

copyDatabase(config.databaseFile, target)

const backup = openReadOnly(target)
const version = schemaVersionOf(backup)

backup.close()
const kilobytes = Math.ceil(statSync(target).size / KB)

console.log(`Backup written to ${target} (${kilobytes} KB, schema version ${version}).`)
