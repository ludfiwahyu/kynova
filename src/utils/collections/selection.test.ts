import assert from 'node:assert/strict'
import { test } from 'node:test'

import { rangeSelection, toggleInSelection, topmostItems } from './selection'

test('⌘ or Ctrl click adds a row, and takes it out again', () => {
    assert.deepEqual(toggleInSelection(['a'], 'b'), ['a', 'b'])
    assert.deepEqual(toggleInSelection(['a', 'b'], 'a'), ['b'])
})

test('Shift click takes every row between, either way', () => {
    const order = ['a', 'b', 'c', 'd', 'e']
    assert.deepEqual(rangeSelection(order, 'b', 'd'), ['b', 'c', 'd'])
    assert.deepEqual(rangeSelection(order, 'd', 'b'), ['b', 'c', 'd'])
    assert.deepEqual(rangeSelection(order, null, 'c'), ['c'])
    assert.deepEqual(rangeSelection(order, 'gone', 'c'), ['c'])
})

test('only the outermost chosen items count', () => {
    const parents: Record<string, string | null> = {
        col: null,
        folder: 'col',
        req: 'folder',
        other: 'col',
    }
    const parentOf = (id: string) => parents[id]
    assert.deepEqual(topmostItems(['req', 'folder', 'other'], parentOf), ['folder', 'other'])
    assert.deepEqual(topmostItems(['req', 'col'], parentOf), ['col'])
    assert.deepEqual(topmostItems(['req', 'other'], parentOf), ['req', 'other'])
})
