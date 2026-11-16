import assert from 'node:assert/strict'
import { test } from 'node:test'

import { enclosingPair, guideCounts, scanBrackets } from './brackets'

test('brackets get their nesting level and partner', () => {
    const found = scanBrackets('{"a":[1,(2)]}')
    assert.deepEqual(
        found.map((b) => b.depth),
        [0, 1, 2, 2, 1, 0],
    )
    assert.equal(found[0].match, 12)
    assert.equal(found[5].match, 0)
})

test('brackets inside strings and comments do not count', () => {
    assert.equal(scanBrackets('{"a":"}[" , \'(\' } // {\n/* [ */').length, 2)
    assert.equal(scanBrackets('"say \\" {"').length, 0)
})

test('a stray apostrophe spoils only its own line', () => {
    assert.equal(scanBrackets("it's\n{}").length, 2)
})

test('unmatched and mismatched closers are marked', () => {
    assert.deepEqual(
        scanBrackets('}').map((b) => b.depth),
        [-1],
    )
    const mismatch = scanBrackets('{]')
    assert.equal(mismatch[1].depth, -1)
    assert.equal(mismatch[0].match, -1)
})

test('the pair around a position is the innermost one', () => {
    const found = scanBrackets('{ [ x ] }')
    assert.deepEqual(enclosingPair(found, 4), {
        open: 2,
        close: 6,
    })
    assert.deepEqual(enclosingPair(found, 8), {
        open: 0,
        close: 8,
    })
    assert.equal(enclosingPair(found, 9), null)
})

test('guides run through blank lines, as in VS Code', () => {
    // Inside a block: the block's guide continues.
    assert.deepEqual(
        guideCounts(['{', '  "a": [', '', '    1', '', '  ]', '}'], 2, 2),
        [0, 1, 2, 2, 2, 1, 0],
    )
    // Between two lines at one level: that level.
    assert.deepEqual(guideCounts(['  a', '', '  b'], 2, 2), [1, 1, 1])
    // After a block, before text at the margin: one level, as VS Code shows.
    assert.deepEqual(guideCounts(['\tx', '', 'y'], 2, 2), [1, 1, 0])
})
