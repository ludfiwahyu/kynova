import assert from 'node:assert/strict'
import { test } from 'node:test'

import { dropPlacement, type ItemsById, moveItems } from './tree'

/**
 *   A (collection)          B (collection)
 *     a1  a2  F (folder)      b1
 *               f1
 */
const item = (id: string, kind: string, parentId: string | null, order: number) =>
    ({
        id,
        kind,
        name: id,
        parentId,
        order,
    }) as never
const items: ItemsById = {
    A: item('A', 'collection', null, 0),
    B: item('B', 'collection', null, 1),
    a1: item('a1', 'http', 'A', 0),
    a2: item('a2', 'http', 'A', 1),
    F: item('F', 'folder', 'A', 2),
    f1: item('f1', 'http', 'F', 0),
    b1: item('b1', 'http', 'B', 0),
}

test('a request goes before, after or inside', () => {
    assert.deepEqual(dropPlacement(items, ['a1'], 'a2', 'after'), {
        parentId: 'A',
        index: 1,
    })
    assert.deepEqual(dropPlacement(items, ['a1'], 'F', 'inside'), {
        parentId: 'F',
        index: 1,
    })
    assert.deepEqual(dropPlacement(items, ['a1'], 'B', 'inside'), {
        parentId: 'B',
        index: 1,
    })
    assert.deepEqual(dropPlacement(items, ['b1'], 'a1', 'before'), {
        parentId: 'A',
        index: 0,
    })
})

test('what cannot be dropped there', () => {
    assert.equal(dropPlacement(items, ['a1'], 'a2', 'inside'), null, 'inside a request')
    assert.equal(dropPlacement(items, ['F'], 'f1', 'before'), null, 'a folder inside itself')
    assert.equal(dropPlacement(items, ['F'], 'F', 'inside'), null, 'onto itself')
    assert.equal(dropPlacement(items, ['A'], 'B', 'inside'), null, 'a collection inside another')
    assert.equal(dropPlacement(items, ['A'], 'b1', 'before'), null, 'a collection among requests')
    assert.equal(dropPlacement(items, ['a1'], 'B', 'before'), null, 'a request among collections')
    assert.equal(
        dropPlacement(items, ['A', 'a1'], 'B', 'after'),
        null,
        'collections with other things',
    )
})

test('collections reorder at the top', () => {
    assert.deepEqual(dropPlacement(items, ['B'], 'A', 'before'), {
        parentId: null,
        index: 0,
    })
})

test('moving renumbers the siblings and saves only what changed', () => {
    const moved = moveItems(items, ['a1'], {
        parentId: 'F',
        index: 1,
    })
    assert.deepEqual(
        moved.map(({ id, parentId, order }) => [id, parentId, order]),
        [['a1', 'F', 1]],
    )

    const reordered = moveItems(items, ['F', 'a1'], {
        parentId: 'A',
        index: 0,
    })
    assert.deepEqual(
        reordered.map(({ id, order }) => [id, order]),
        [
            ['F', 0],
            ['a1', 1],
            ['a2', 2],
        ],
    )
})
