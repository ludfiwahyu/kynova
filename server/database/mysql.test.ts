import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { after, test } from 'node:test'

import mysql from 'mysql2/promise'

const adminUrl = process.env.KYNOVA_TEST_MYSQL_URL
const skip = adminUrl ? false : 'set KYNOVA_TEST_MYSQL_URL to run against MySQL'

process.env.DATA_DIR = mkdtempSync(path.join(tmpdir(), 'kynova-mysql-'))

const { openMysql } = await import('./adapters/mysql.ts')
const { migrate, schemaVersion, LATEST_VERSION } = await import('./migrations/index.ts')
const { runIn } = await import('./context.ts')
const { register, login } = await import('#server/services/auth.ts')
const { acceptInvite, createInvite, createWorkspace, listMembers } =
    await import('#server/services/workspaces.ts')

const name = `kynova_test_${Date.now()}`
const toClose: { close: () => Promise<void> }[] = []

async function freshDatabase(): Promise<string> {
    const admin = await mysql.createConnection(adminUrl!)
    await admin.query(`CREATE DATABASE ${name}`)
    await admin.end()

    const url = new URL(adminUrl!)
    url.pathname = `/${name}`
    return url.toString()
}

after(async () => {
    if (!adminUrl) {
        return
    }

    await Promise.all(toClose.map((db) => db.close().catch(() => {})))

    const admin = await mysql.createConnection(adminUrl)
    await admin.query(`DROP DATABASE IF EXISTS ${name}`)
    await admin.end()
})

test('MySQL migrates, and accounts, workspaces and invites work on it', { skip }, async () => {
    const db = await openMysql(await freshDatabase())
    toClose.push(db)

    await migrate(db)
    assert.equal(await schemaVersion(db), LATEST_VERSION)

    // Migrating again changes nothing.
    await migrate(db)
    assert.equal(await schemaVersion(db), LATEST_VERSION)

    const target = {
        id: 'local',
        kind: 'local' as const,
        label: 'Local',
        detail: 'MySQL',
        db,
    }

    await runIn(target, async () => {
        const owner = await register('Owner@Example.com', 'Owner', 'correct horse battery')
        const guest = await register('guest@example.com', 'Guest', 'correct horse battery')

        // The same email again is refused: ON CONFLICT DO NOTHING became INSERT IGNORE.
        await assert.rejects(register('Owner@Example.com', 'Again', 'correct horse battery'))
        assert.equal((await login('Owner@Example.com', 'correct horse battery')).id, owner.id)

        const workspace = await createWorkspace(owner.id, 'Team')
        const token = await createInvite(workspace.id, 'editor')
        await acceptInvite(token, guest.id)
        // Accepting twice keeps one membership.
        await acceptInvite(token, guest.id)

        const members = await listMembers(workspace.id)
        assert.deepEqual(members.map((member) => member.role).sort(), ['editor', 'owner'])
        // Quoted aliases ("userId") come back with their case, thanks to ANSI_QUOTES.
        assert.deepEqual(members.map((member) => member.userId).sort(), [owner.id, guest.id].sort())
    })
})

test('MySQL keeps ids case-sensitive and stores large documents', { skip }, async () => {
    const db = await openMysql(new URL(`/${name}`, adminUrl!).toString())
    toClose.push(db)

    await db.run('INSERT INTO workspaces (id, name, created_at) VALUES (?, ?, ?)', ['abc', 'a', 1])
    await db.run('INSERT INTO workspaces (id, name, created_at) VALUES (?, ?, ?)', ['ABC', 'b', 1])
    assert.equal((await db.all('SELECT id FROM workspaces WHERE id = ?', ['abc'])).length, 1)

    // Larger than TEXT's 64 KB.
    const big = 'x'.repeat(200_000)
    const upsert =
        'INSERT INTO docs (workspace_id, entity, id, data) VALUES (?, ?, ?, ?) ' +
        'ON CONFLICT (workspace_id, entity, id) DO UPDATE SET data = excluded.data'

    await db.run(upsert, ['abc', 'items', 'one', 'first'])
    await db.run(upsert, ['abc', 'items', 'one', big])

    const row = await db.get<{ data: string }>('SELECT data FROM docs WHERE id = ?', ['one'])
    assert.equal(row?.data.length, big.length)

    // A transaction that fails leaves nothing behind.
    await assert.rejects(
        db.transaction(async (tx) => {
            await tx.run('INSERT INTO workspaces (id, name, created_at) VALUES (?, ?, ?)', [
                't',
                't',
                1,
            ])
            throw new Error('stop')
        }),
    )
    assert.equal(await db.get('SELECT id FROM workspaces WHERE id = ?', ['t']), undefined)
})
