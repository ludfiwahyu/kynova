import assert from 'node:assert/strict'
import { test } from 'node:test'

import { formatJson, highlightStyled, toJson, toSendableJson, toStyle } from './jsonStyle'

const JSON_TEXT =
    '{\n  "name": "Budi",\n  "age": 20,\n  "ok": true,\n  "tags": ["a", "b c"],\n  "none": null\n}'

test('writes JSON in each style, keeping spacing and line breaks', () => {
    assert.equal(toStyle(JSON_TEXT, 'double'), JSON_TEXT)
    assert.equal(
        toStyle(JSON_TEXT, 'single'),
        "{\n  'name': 'Budi',\n  'age': 20,\n  'ok': true,\n  'tags': ['a', 'b c'],\n  'none': null\n}",
    )
    assert.equal(
        toStyle(JSON_TEXT, 'bare'),
        '{\n  name: Budi,\n  age: 20,\n  ok: true,\n  tags: [a, b c],\n  none: null\n}',
    )
})

test('reads every style back to the same JSON', () => {
    for (const style of ['double', 'single', 'bare'] as const) {
        const written = toStyle(JSON_TEXT, style)!
        assert.deepEqual(JSON.parse(toJson(written)!), JSON.parse(JSON_TEXT), style)
    }
})

test('keeps quotes where no quotes would change the value', () => {
    const value = {
        n: '5',
        t: 'true',
        e: '',
        s: ' padded ',
        c: 'a,b',
        v: '{{id}}',
        colon: ':)',
        k: 'x',
    }
    const bare = toStyle(JSON.stringify(value), 'bare')!
    assert.deepEqual(JSON.parse(toJson(bare)!), value)
    assert.match(bare, /n:"5"/)
    assert.match(bare, /k:x/)
})

test('escapes quotes inside single-quoted strings', () => {
    const value = { says: `it's "fine"\n` }
    const single = toStyle(JSON.stringify(value), 'single')!
    assert.equal(single, `{'says':'it\\'s "fine"\\n'}`)
    assert.deepEqual(JSON.parse(toJson(single)!), value)
})

test('drops trailing commas and trims bare values', () => {
    assert.equal(
        toJson('{\n variable : value,\n\nvariableb :     valueb      \n}'),
        '{\n "variable" : "value",\n\n"variableb" :     "valueb"      \n}',
    )
    assert.equal(toJson('{ "a": [1, 2,], }'), '{ "a": [1, 2] }')
})

test('keeps {{variables}} as they are, quoted or not', () => {
    assert.equal(
        toJson('{ id: {{userId}}, name: "{{name}}", url: {{base}}/users }'),
        '{ "id": {{userId}}, "name": "{{name}}", "url": "{{base}}/users" }',
    )
    assert.equal(toJson('{"a":{{x}}}'), '{"a":{{x}}}')
    assert.equal(toStyle('{ "id": {{userId}} }', 'bare'), '{ id: {{userId}} }')
})

test('leaves text that is not JSON alone', () => {
    assert.equal(toJson('{ "a": '), null)
    assert.equal(toJson("{ 'a: 1 }"), null)
    assert.equal(toJson('{ "a": 1 } extra'), null)
    assert.equal(toStyle('not: json, really', 'bare'), null)
    assert.equal(toJson('   '), '   ')
})

test('formats any style one member per line, in the chosen style', () => {
    assert.equal(
        formatJson('{\n variable : value,\n\nvariableb :     valueb      \n}', 'bare'),
        '{\n  variable : value,\n  variableb : valueb\n}',
    )
    assert.equal(
        formatJson("{'a':[1,{'b':[]},{}],}", 'double', '\t'),
        '{\n\t"a" : [\n\t\t1,\n\t\t{\n\t\t\t"b" : []\n\t\t},\n\t\t{}\n\t]\n}',
    )
    assert.equal(formatJson('[1, 2', 'bare'), null)
})

test('colours keys, strings, numbers, literals and variables in any style', () => {
    const kinds = highlightStyled("{ name: 'x', n: 1, ok: false, id: {{id}} }")
        .filter((token) => token.kind !== 'plain')
        .map((token) => [token.text, token.kind])
    assert.deepEqual(kinds, [
        ['name', 'key'],
        ["'x'", 'string'],
        ['n', 'key'],
        ['1', 'number'],
        ['ok', 'key'],
        ['false', 'literal'],
        ['id', 'key'],
        ['{{id}}', 'variable'],
    ])
})

test('round-trips random JSON through every style', () => {
    let seed = 7
    const random = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31
    const pick = <T>(items: T[]) => items[Math.floor(random() * items.length)]
    const words = [
        'a',
        'b c',
        '',
        ' x',
        '5',
        '-1.5',
        'true',
        'null',
        "it's",
        'say "hi"',
        'a:b',
        '{{v}}',
        'é',
        '\t',
        'x,y',
        '[1]',
        '\\',
    ]

    function value(depth: number): unknown {
        const kind =
            depth > 3
                ? pick(['string', 'number', 'literal'])
                : pick(['string', 'number', 'literal', 'array', 'object'])
        if (kind === 'string') {
            return pick(words)
        }
        if (kind === 'number') {
            return pick([0, -2, 3.25, 1e21])
        }
        if (kind === 'literal') {
            return pick([true, false, null])
        }
        if (kind === 'array') {
            return Array.from({ length: Math.floor(random() * 4) }, () => value(depth + 1))
        }
        return Object.fromEntries(
            Array.from({ length: Math.floor(random() * 4) }, () => [pick(words), value(depth + 1)]),
        )
    }

    for (let run = 0; run < 300; run++) {
        const original = value(0)
        const json = JSON.stringify(original, null, run % 2 ? 2 : undefined)
        for (const style of ['double', 'single', 'bare'] as const) {
            const written = toStyle(json, style)!
            assert.deepEqual(JSON.parse(toJson(written)!), original, `${style}: ${written}`)
            assert.deepEqual(
                JSON.parse(toJson(formatJson(written, style)!)!),
                original,
                `${style} formatted`,
            )
        }
    }
})

test('trailing commas end the last member of every object and array', () => {
    assert.equal(
        formatJson("{'employee': 'd', 'name': 'lee'}", 'single', '  ', true),
        "{\n  'employee' : 'd',\n  'name' : 'lee',\n}",
    )
    assert.equal(
        formatJson('{"a":[1,2,],"b":{}}', 'double', '  ', true),
        '{\n  "a" : [\n    1,\n    2,\n  ],\n  "b" : {},\n}',
    )
    assert.equal(formatJson('{"a":[1,2,],}', 'double'), '{\n  "a" : [\n    1,\n    2\n  ]\n}')
})

test('text with trailing commas is plain JSON again once stored', () => {
    const written = formatJson("{'a': 1, 'b': [2]}", 'single', '  ', true)!
    assert.deepEqual(JSON.parse(toJson(written)!), {
        a: 1,
        b: [2],
    })
})

test('// lines stay in the stored body, in every style and in Beautify', () => {
    const text = '{\n  "a": 1,\n  // "b": 2\n}'

    assert.equal(toJson(text), text)
    assert.equal(toStyle(text, 'bare'), '{\n  a: 1,\n  // "b": 2\n}')
    assert.equal(formatJson(text, 'double'), '{\n  "a" : 1,\n  // "b": 2\n}')
    assert.equal(
        formatJson('{"a":1,\n// note\n"b":2}', 'double'),
        '{\n  "a" : 1,\n  // note\n  "b" : 2\n}',
    )
    assert.ok(
        highlightStyled(text).some(
            (token) => token.kind === 'comment' && token.text === '// "b": 2',
        ),
    )
})

test('a comment keeps the comma before it, and Beautify adds no comma inside it', () => {
    const text = '{\n  "a": 1,\n  // "b": 2\n}'

    assert.equal(formatJson(text, 'double', '  ', true), '{\n  "a" : 1,\n  // "b": 2\n}')
})

test('sending drops // lines and the comma they leave before a bracket', () => {
    assert.equal(toSendableJson('{\n  "a": 1,\n  // "b": 2\n}'), '{\n  "a": 1\n}')
    assert.equal(toSendableJson('[\n  // 0,\n  1,\n  2\n]'), '[\n  1,\n  2\n]')
    assert.deepEqual(
        JSON.parse(toSendableJson('{\n  "a": "{{x}}",\n    // "b": 2,\n  "c": 3\n}')),
        {
            a: '{{x}}',
            c: 3,
        },
    )
})

test('sending leaves text without // lines, and // inside a string, as written', () => {
    const url = '{ "url": "https://example.com//x" }'

    assert.equal(toSendableJson(url), url)
    assert.equal(toSendableJson('{"a":1,}'), '{"a":1,}')
})
