import assert from 'node:assert/strict'
import { mkdtempSync, readdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { after, test } from 'node:test'

import pg from 'pg'

const adminUrl = process.env.KYNOVA_TEST_POSTGRES_URL
const skip = adminUrl ? false : 'set KYNOVA_TEST_POSTGRES_URL to run against PostgreSQL'

process.env.DATA_DIR = mkdtempSync(path.join(tmpdir(), 'kynova-pg-'))
const { connectTarget, localTarget, testTarget } = await import('./targets.ts')
const { openPostgres } = await import('./adapters/postgres.ts')
const { migrate, schemaVersion, LATEST_VERSION } = await import('./migrations/index.ts')
const { runIn } = await import('./context.ts')
const { register, login } = await import('#server/services/auth.ts')

const prefix = `kynova_test_${Date.now()}`
const SUPABASE_FOLDER = 'server/database/migrations/supabase'
const created: string[] = []
const toClose: { close: () => Promise<void> }[] = []

/** A fresh, empty database on the test server, and its URL. */
async function freshDatabase(name: string): Promise<string> {
    const admin = new pg.Client({ connectionString: adminUrl })
    await admin.connect()
    await admin.query(`CREATE DATABASE ${prefix}_${name}`)
    await admin.end()
    created.push(`${prefix}_${name}`)
    const url = new URL(adminUrl!)
    url.pathname = `/${prefix}_${name}`
    return url.toString()
}

after(async () => {
    if (!adminUrl) {
        return
    }
    await Promise.all(toClose.map((db) => db.close().catch(() => {})))
    const admin = new pg.Client({ connectionString: adminUrl })
    await admin.connect()
    for (const name of created) {
        await admin.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`)
    }
    await admin.end()
})

test(
    'a picked database gets its tables in the kynova schema, with row level security',
    { skip },
    async () => {
        const url = await freshDatabase('picked')
        const target = await connectTarget({
            url,
            ssl: 'off',
        })
        toClose.push(target.db)
        assert.equal(target.kind, 'postgres')
        assert.match(target.detail, new RegExp(`/${prefix}_picked$`))

        const tables = await target.db.all<{
            name: string
            rls: boolean
        }>(
            `SELECT c.relname AS name, c.relrowsecurity AS rls FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'kynova' AND c.relkind = 'r' ORDER BY c.relname`,
        )
        assert.deepEqual(
            tables,
            [
                'docs',
                'invites',
                'members',
                'schema_migrations',
                'sessions',
                'users',
                'workspaces',
            ].map((name) => ({
                name,
                rls: true,
            })),
        )
        assert.equal(await schemaVersion(target.db), LATEST_VERSION)
        assert.equal(
            (
                await target.db.get<{ count: number }>(
                    "SELECT COUNT(*) AS count FROM pg_tables WHERE schemaname = 'public'",
                )
            )?.count,
            0,
        )

        const again = await connectTarget({
            url,
            ssl: 'off',
        })
        assert.equal(again, target, 'the same connection details reuse the open database')
    },
)

test('accounts belong to the database they were made in', { skip }, async () => {
    const target = await connectTarget({
        url: await freshDatabase('accounts'),
        ssl: 'off',
    })
    toClose.push(target.db)
    await runIn(target, () => register('shared@test.dev', 'Shared', 'password1'))
    assert.equal(
        (await runIn(target, () => login('shared@test.dev', 'password1'))).email,
        'shared@test.dev',
    )
    await assert.rejects(
        runIn(await localTarget(), () => login('shared@test.dev', 'password1')),
        /incorrect/,
    )
})

test('servers migrating one database at once each run every migration once', { skip }, async () => {
    const url = await freshDatabase('race')
    const connections = await Promise.all(
        [1, 2, 3].map(() => openPostgres(url, { schema: 'kynova' })),
    )
    toClose.push(...connections)
    await Promise.all(connections.map((db) => migrate(db)))
    const rows = await connections[0].all<{ version: number }>(
        'SELECT version FROM schema_migrations ORDER BY version',
    )
    assert.deepEqual(
        rows.map(({ version }) => version),
        [1, 2, 3],
    )
})

test(
    'the generated SQL files build the same database, and the app then has nothing to run',
    { skip },
    async () => {
        const url = await freshDatabase('sqlfiles')
        const client = new pg.Client({ connectionString: url })
        await client.connect()
        for (const file of readdirSync(SUPABASE_FOLDER).sort()) {
            await client.query(readFileSync(path.join(SUPABASE_FOLDER, file), 'utf8'))
        }
        await client.end()

        const db = await openPostgres(url, { schema: 'kynova' })
        toClose.push(db)
        const before = await db.all<{
            version: number
            applied_at: number
        }>('SELECT version, applied_at FROM schema_migrations ORDER BY version')
        await migrate(db)
        assert.deepEqual(
            await db.all('SELECT version, applied_at FROM schema_migrations ORDER BY version'),
            before,
            'no migration ran again',
        )
        assert.equal(before.length, LATEST_VERSION)
    },
)

test('servers on one database hear each other through NOTIFY', { skip }, async () => {
    const url = await freshDatabase('notify')
    const [first, second] = await Promise.all([openPostgres(url), openPostgres(url)])
    toClose.push(first, second)
    const heard = new Promise<string>((resolve) => first.onNotify(resolve))
    await new Promise((resolve) => setTimeout(resolve, 300)) // The listening connection opens.
    await second.notify('{"hello":1}')
    assert.equal(await heard, '{"hello":1}')
})

test('testing a connection reports the server version, or why it failed', { skip }, async () => {
    const url = await freshDatabase('test')
    assert.match(
        (
            await testTarget({
                url,
                ssl: 'off',
            })
        ).version,
        /^\d+/,
    )
    const wrong = new URL(url)
    wrong.password = 'wrong'
    await assert.rejects(
        testTarget({
            url: wrong.toString(),
            ssl: 'off',
        }),
        /password authentication failed/,
    )
    await assert.rejects(
        testTarget({
            url,
            ssl: 'verify',
        }),
        /SSL/i,
    )
})
