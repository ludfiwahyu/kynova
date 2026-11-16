import assert from 'node:assert/strict'
import { test } from 'node:test'

import { highlightJson, tokenKind } from './highlightJson'

test('classifies keys, strings, numbers and literals', () => {
    const kinds = highlightJson('{"a": "x", "n": -1.5e3, "ok": true, "none": null}')
        .filter((token) => token.kind !== 'plain')
        .map((token) => [token.text, token.kind])

    assert.deepEqual(kinds, [
        ['"a"', 'key'],
        ['"x"', 'string'],
        ['"n"', 'key'],
        ['-1.5e3', 'number'],
        ['"ok"', 'key'],
        ['true', 'literal'],
        ['"none"', 'key'],
        ['null', 'literal'],
    ])
})

test('tokens join back into the original text', () => {
    const text = '{\n  "quote": "say \\"hi\\": now",\n  "list": [1, 2]\n}'
    assert.equal(
        highlightJson(text)
            .map((token) => token.text)
            .join(''),
        text,
    )
})

test('each type of value gets its own colour class', () => {
    const kinds = highlightJson('{"a": "x", "b": 1, "c": true, "d": null}').map(tokenKind)
    assert.deepEqual(
        kinds.filter((kind) => kind !== 'plain'),
        ['key', 'string', 'key', 'number', 'key', 'boolean', 'key', 'null'],
    )
})
