import assert from 'node:assert/strict'
import { test } from 'node:test'

import { minimapRuns } from '@/components/ui/CodeEditor/logic/minimap'

test('minimapRuns colours strings, numbers and punctuation, and skips spaces', () => {
    assert.deepEqual(
        minimapRuns('  "id": 42,').map(({ from, to, kind }) => [from, to, kind]),
        [
            [2, 6, 'string'],
            [6, 7, 'punct'],
            [8, 10, 'number'],
            [10, 11, 'punct'],
        ],
    )
})

test('minimapRuns keeps an escaped quote inside its string', () => {
    assert.deepEqual(minimapRuns('"a\\"b" x'), [
        {
            from: 0,
            to: 6,
            kind: 'string',
        },
        {
            from: 7,
            to: 8,
            kind: 'ink',
        },
    ])
})
