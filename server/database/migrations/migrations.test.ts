import assert from 'node:assert/strict'
import { test } from 'node:test'

import { splitStatements, toMysql } from '#server/database/adapters/mysql.ts'

import { ENGINES, LATEST_VERSION, migrationsFor } from './index.ts'

test('every engine has the same migrations, numbered without gaps', () => {
    const expected = migrationsFor('sqlite').map(({ version, name }) => ({
version,
name 
}))

    assert.deepEqual(
        expected.map(({ version }) => version),
        Array.from({ length: LATEST_VERSION }, (_, index) => index + 1),
    )

    for (const engine of ENGINES) {
        assert.deepEqual(
            migrationsFor(engine).map(({ version, name }) => ({
version,
name 
})),
            expected,
            engine,
        )
    }
})

test('MySQL gets its own words for the two portable upserts', () => {
    assert.equal(
        toMysql('INSERT INTO users (id, email) VALUES (?, ?) ON CONFLICT (email) DO NOTHING'),
        'INSERT IGNORE INTO users (id, email) VALUES (?, ?)',
    )
    assert.equal(
        toMysql(
            'INSERT INTO docs (a, data) VALUES (?, ?)\n ON CONFLICT (a) DO UPDATE SET data = excluded.data',
        ),
        'INSERT INTO docs (a, data) VALUES (?, ?)\n AS excluded ON DUPLICATE KEY UPDATE data = excluded.data',
    )
    assert.equal(toMysql('SELECT 1'), 'SELECT 1')
})

test('a MySQL migration file splits into its statements, without comments', () => {
    const statements = splitStatements(migrationsFor('mysql')[0].sql)

    assert.equal(statements.length, 6)
    assert.ok(statements.every((statement) => statement.startsWith('CREATE TABLE')))
    assert.deepEqual(splitStatements('-- nothing to do\n'), [])
})
