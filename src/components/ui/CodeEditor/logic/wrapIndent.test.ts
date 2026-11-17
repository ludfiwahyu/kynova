import assert from 'node:assert/strict'
import { test } from 'node:test'

import { indentColumns } from './wrapIndent'

test('counts spaces', () => {
    assert.equal(indentColumns('    "a": 1', 2), 4)
    assert.equal(indentColumns('"a": 1', 2), 0)
})

test('a tab goes to the next tab stop', () => {
    assert.equal(indentColumns('\t"a"', 4), 4)
    assert.equal(indentColumns('  \t"a"', 4), 4)
})
