import assert from 'node:assert/strict'
import { test } from 'node:test'

import { stringAt } from './stringAt'

const line = '  "name": "Ada Lovelace",'

test('finds the key and the value under an offset', () => {
    assert.deepEqual(stringAt(line, 4), {
        start: 2,
        end: 8,
    })
    assert.deepEqual(stringAt(line, 14), {
        start: 10,
        end: 24,
    })
})

test('a quote on either side counts as inside', () => {
    assert.deepEqual(stringAt(line, 2), {
        start: 2,
        end: 8,
    })
    assert.deepEqual(stringAt(line, 8), {
        start: 2,
        end: 8,
    })
})

test('reads single quotes, escapes and a quote of the other kind inside', () => {
    assert.deepEqual(stringAt(`'it\\'s "ok"'`, 5), {
        start: 0,
        end: 12,
    })
})

test('finds nothing outside a string, in a number, or after //', () => {
    assert.equal(stringAt('  "a": 12345,', 10), null)
    assert.equal(stringAt('// "a" it\'s', 5), null)
})
