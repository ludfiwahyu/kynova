import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

import { inferSslMode } from '#shared/databaseUrl.ts'

process.env.DATA_DIR = mkdtempSync(path.join(tmpdir(), 'kynova-targets-'))
const { parseTarget } = await import('./targets.ts')
const { migrationFiles } = await import('./scripts/migrationSql.ts')

const message = (work: () => unknown) => {
    try {
        work()
    } catch (error) {
        return (error as Error).message
    }
    return 'no error'
}

test('reads a Supabase session pooler string: project from the user name, SSL kept', () => {
    const parsed = parseTarget({
        url: 'postgresql://postgres.abcdref:p%40ss@aws-0-eu-central-1.pooler.supabase.com:5432/postgres',
        ssl: 'verify',
        ca: 'CA',
    })
    assert.equal(parsed.kind, 'supabase')
    assert.equal(parsed.detail, 'abcdref')
    assert.deepEqual(parsed.connection, {
        host: 'aws-0-eu-central-1.pooler.supabase.com',
        port: 5432,
        user: 'postgres.abcdref',
        password: 'p@ss',
        database: 'postgres',
        ssl: {
            rejectUnauthorized: true,
            servername: 'aws-0-eu-central-1.pooler.supabase.com',
            ca: 'CA',
        },
    })
})

test('reads a Supabase direct connection and a plain PostgreSQL one', () => {
    assert.equal(
        parseTarget({
            url: 'postgresql://postgres:x@db.qwerty.supabase.co:5432/postgres',
            ssl: 'require',
        }).detail,
        'qwerty',
    )
    const plain = parseTarget({
        url: 'postgres://app:secret@db.example.com:6000/kynova?sslmode=disable',
        ssl: 'off',
    })
    assert.equal(plain.kind, 'postgres')
    assert.equal(plain.detail, 'db.example.com:6000/kynova')
    assert.equal(plain.connection.ssl, false)
    assert.deepEqual(
        parseTarget({
            url: 'postgres://a:b@h/d',
            ssl: 'require',
        }).connection.ssl,
        { rejectUnauthorized: false },
    )
})

test('refuses what cannot work, saying why', () => {
    assert.match(
        message(() =>
            parseTarget({
                url: 'mysql://a@b/c',
                ssl: 'off',
            }),
        ),
        /must start with postgresql:\/\//,
    )
    assert.match(
        message(() =>
            parseTarget({
                url: 'not a url',
                ssl: 'off',
            }),
        ),
        /Paste a connection string/,
    )
    assert.match(
        message(() =>
            parseTarget({
                url: 'postgresql://postgres.ref:x@aws-0-x.pooler.supabase.com:6543/postgres',
                ssl: 'verify',
            }),
        ),
        /transaction pooler/,
    )
    assert.match(
        message(() =>
            parseTarget({
                url: 'postgresql://postgres:x@db.ref.supabase.co:5432/postgres',
                ssl: 'off',
            }),
        ),
        /only SSL/,
    )
    assert.match(
        message(() =>
            parseTarget({
                url: 'postgres://a:b@h/d',
                ssl: 'maybe' as never,
            }),
        ),
        /Choose how to use SSL/,
    )
})

test('suggests SSL from the connection string', () => {
    assert.equal(inferSslMode('postgres://a:b@h/d'), 'off')
    assert.equal(inferSslMode('postgres://a:b@h/d?sslmode=require'), 'require')
    assert.equal(inferSslMode('postgres://a:b@h/d?sslmode=verify-full'), 'verify')
    assert.equal(inferSslMode('postgres://a:b@db.x.supabase.co/postgres'), 'verify')
    assert.equal(inferSslMode('postgres://a:b@db.x.supabase.co/postgres?sslmode=disable'), 'off')
})

test('the committed Supabase migration files match the PostgreSQL migrations (run npm run db:sql)', () => {
    const files = migrationFiles()
    assert.ok(Object.keys(files).length >= 3)
    for (const [file, content] of Object.entries(files)) {
        assert.equal(readFileSync(path.resolve(file), 'utf8'), content, file)
    }
})
