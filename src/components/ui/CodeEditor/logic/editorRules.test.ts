import assert from 'node:assert/strict'
import { test } from 'node:test'

import { bracketIndentation, closeBracketsConfig, leadingColumns } from './editorRules'

test('auto closing follows the two VS Code settings', () => {
    assert.deepEqual(closeBracketsConfig('languageDefined', 'languageDefined').brackets, [
        '(',
        '[',
        '{',
        '"',
        "'",
        '`',
    ])
    assert.deepEqual(closeBracketsConfig('never', 'languageDefined').brackets, ['"', "'", '`'])
    assert.deepEqual(closeBracketsConfig('languageDefined', 'never').brackets, ['(', '[', '{'])
    assert.deepEqual(closeBracketsConfig('never', 'never').brackets, [])

    assert.equal(closeBracketsConfig('languageDefined', 'languageDefined').before, ')]}:;>,')
    const always = closeBracketsConfig('always', 'never').before
    for (const char of 'aZ09_-."{') {
        assert.ok(always.includes(char), char)
    }
})

test('leading whitespace counts tabs to the next tab stop', () => {
    assert.equal(leadingColumns('    x', 4), 4)
    assert.equal(leadingColumns('\tx', 4), 4)
    assert.equal(leadingColumns('  \tx', 4), 4)
    assert.equal(leadingColumns('x', 4), 0)
})

test('a new line goes one level deeper after an opening bracket, shallower before a closing one', () => {
    assert.equal(bracketIndentation('  "a": {', '', 2, 2), 4)
    assert.equal(bracketIndentation('  [', ']', 2, 2), 2)
    assert.equal(bracketIndentation('    "b": 1,', '', 2, 2), 4)
    assert.equal(bracketIndentation('    "b": 1', '}', 2, 2), 2)
    assert.equal(bracketIndentation('x', ')', 4, 4), 0)
})
