import { LATEST_VERSION, migrate, schemaVersion } from '#server/database/migrations/index.ts'
import { localTarget } from '#server/database/targets.ts'

import { openCliTarget } from './cliTarget.ts'

const USAGE =
    'Name the database: npm run db:migrate -- postgresql://user:password@host:5432/postgres [--ssl verify|require|off] [--ca <file>] [--schema kynova]'

const args = process.argv.slice(2)

if (args.length === 0) {
    // Opening the local database migrates it.
    const local = await localTarget()

    console.log(
        `The local database is at schema version ${await schemaVersion(local.db)} of ${LATEST_VERSION}.`,
    )
    await local.db.close()
} else {
    const { db, description } = await openCliTarget(args, USAGE)

    try {
        await migrate(db)
        console.log(
            `${description} is at schema version ${await schemaVersion(db)} of ${LATEST_VERSION}.`,
        )
    } finally {
        await db.close()
    }
}
