import { readFileSync } from 'node:fs'

import { openMysql } from '#server/database/adapters/mysql.ts'
import { openPostgres } from '#server/database/adapters/postgres.ts'
import { EXTERNAL_SCHEMA, parseTarget } from '#server/database/targets.ts'
import type { Database } from '#server/database/types.ts'
import { inferSslMode, type SslMode } from '#shared/databaseUrl.ts'
import { DATABASE_URL } from '#shared/patterns.ts'

import { fail } from './sqliteFile.ts'

export interface CliTarget {
    db: Database
    /** For messages, without the password. */
    description: string
    schema: string
}

function flag(args: string[], name: string): string | undefined {
    const index = args.indexOf(`--${name}`)

    return index === -1 ? undefined : args[index + 1]
}

export async function openCliTarget(
    args: string[],
    usage: string,
    defaultSchema = EXTERNAL_SCHEMA,
): Promise<CliTarget> {
    const url = args.find(
        (arg, index) => !arg.startsWith('--') && !args[index - 1]?.startsWith('--'),
    )

    if (url && DATABASE_URL.mysql.test(url)) {
        try {
            const db = await openMysql(url)
            const { hostname, port, pathname } = new URL(url)

            return {
                db,
                description: `MySQL ${hostname}${port ? `:${port}` : ''}${pathname}`,
                schema: '',
            }
        } catch (error) {
            fail((error as Error).message)
        }
    }

    if (!url || !DATABASE_URL.postgres.test(url)) {
        fail(usage)
    }

    const ssl = (flag(args, 'ssl') ?? inferSslMode(url)) as SslMode
    const caFile = flag(args, 'ca')
    const schema = flag(args, 'schema') ?? defaultSchema
    let parsed

    try {
        parsed = parseTarget({
            url,
            ssl,
            ...(caFile && { ca: readFileSync(caFile, 'utf8') }),
        })
    } catch (error) {
        fail((error as Error).message)
    }

    try {
        const db = await openPostgres(parsed.connection, { schema })

        return {
            db,
            description: `${parsed.label} ${parsed.detail}, schema ${schema}`,
            schema,
        }
    } catch (error) {
        fail(
            `${(error as Error).message}${ssl === 'verify' ? '\nIf the certificate cannot be verified, pass the CA with --ca <file>, or --ssl require.' : ''}`,
        )
    }
}
