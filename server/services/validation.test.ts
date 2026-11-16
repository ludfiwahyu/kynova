import assert from 'node:assert/strict'
import { test } from 'node:test'

import { isValidEnvironment, isValidItem } from '#server/services/validation.ts'

const environment = {
    id: 'env-1',
    name: 'Staging',
    variables: [],
}

const collection = {
    id: 'col-1',
    kind: 'collection',
    parentId: null,
    name: 'API',
    order: 1,
}

test('an environment and a collection may carry a known colour tag', () => {
    assert.equal(
        isValidEnvironment({
            ...environment,
            color: 'teal',
        }),
        true,
    )
    assert.equal(
        isValidItem({
            ...collection,
            color: 'red',
        }),
        true,
    )
})

test('no colour tag is fine; an unknown one is refused', () => {
    assert.equal(isValidEnvironment(environment), true)
    assert.equal(isValidItem(collection), true)
    assert.equal(
        isValidEnvironment({
            ...environment,
            color: 'chartreuse',
        }),
        false,
    )
    assert.equal(
        isValidItem({
            ...collection,
            color: 'crimson',
        }),
        false,
    )
})

test('a colour tag may be any colour written as #rrggbb', () => {
    assert.equal(
        isValidItem({
            ...collection,
            color: '#3b72e1',
        }),
        true,
    )
    assert.equal(
        isValidEnvironment({
            ...environment,
            color: '#ABCDEF',
        }),
        true,
    )
    assert.equal(
        isValidItem({
            ...collection,
            color: '#ff00',
        }),
        false,
    )
    assert.equal(
        isValidItem({
            ...collection,
            color: 'url(x)',
        }),
        false,
    )
})
