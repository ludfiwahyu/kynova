import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
    insertVariable,
    matchVariables,
    placeholderAt,
    resolveVariables,
    scopeVariables,
    unresolvedVariables,
    usedVariables,
    variableEntries,
    variableQuery,
} from './variables'

test('scopeVariables keeps enabled, named variables, and the environment wins', () => {
    const row = (key: string, value: string, enabled = true) => ({
        id: key,
        key,
        value,
        enabled,
    })
    const variables = scopeVariables(
        [row('host', 'collection.dev'), row('token', 'from-collection')],
        [row('host', 'env.dev'), row('token', 'secret', false), row('', 'orphan')],
    )
    assert.deepEqual(variables, {
        host: 'env.dev',
        token: 'from-collection',
    })
})

test('resolveVariables fills known names and leaves unknown ones as written', () => {
    const resolved = resolveVariables('{{host}}/users/{{ id }}?t={{missing}}', {
        host: 'https://api.dev',
        id: '7',
    })
    assert.equal(resolved, 'https://api.dev/users/7?t={{missing}}')
})

test('unresolvedVariables lists each missing name once', () => {
    assert.deepEqual(unresolvedVariables('{{a}}/{{b}}/{{a}}/{{c}}', { b: 'x' }), ['a', 'c'])
})

test('dynamic variables are never reported as missing, and a variable named like one wins', () => {
    assert.deepEqual(unresolvedVariables('{{$guid}} {{$timestamp}} {{nope}}', {}), ['nope'])
    assert.equal(resolveVariables('{{$guid}}', { $guid: 'fixed' }), 'fixed')
    assert.match(resolveVariables('{{$timestamp}}', {}), /^\d{10}$/)
})

test('variableEntries: environment first and winning, then collection, then dynamic', () => {
    const entries = variableEntries(
        [
            {
                id: '1',
                key: 'host',
                value: 'collection.example',
                enabled: true,
            },
            {
                id: '2',
                key: 'token',
                value: 'abc',
                enabled: true,
            },
            {
                id: '3',
                key: 'off',
                value: 'x',
                enabled: false,
            },
        ],
        [
            {
                id: '4',
                key: 'host',
                value: 'env.example',
                enabled: true,
            },
        ],
    )
    assert.deepEqual(entries.slice(0, 2), [
        {
            name: 'host',
            value: 'env.example',
            scope: 'environment',
        },
        {
            name: 'token',
            value: 'abc',
            scope: 'collection',
        },
    ])
    assert.ok(entries.some((entry) => entry.name === '$guid' && entry.scope === 'dynamic'))
    assert.ok(!entries.some((entry) => entry.name === 'off'))
})

test('variableQuery finds the unfinished {{ before the caret', () => {
    assert.deepEqual(variableQuery('{{API', 5), {
        start: 0,
        query: 'API',
    })
    assert.deepEqual(variableQuery('https://{{', 10), {
        start: 8,
        query: '',
    })
    assert.deepEqual(variableQuery('{{ ho', 5), {
        start: 0,
        query: 'ho',
    })
    assert.equal(variableQuery('{{API}}/x', 9), null)
    assert.equal(variableQuery('{{a b', 5), null)
    assert.equal(variableQuery('plain', 5), null)
})

test('insertVariable completes the name and does not double what follows', () => {
    assert.deepEqual(insertVariable('{{AP/api', 0, 4, 'API_BASE'), {
        text: '{{API_BASE}}/api',
        caret: 12,
    })
    // Typed in the middle of a name that is already closed.
    assert.deepEqual(insertVariable('{{AP_BASE}}/x', 0, 4, 'API_BASE'), {
        text: '{{API_BASE}}/x',
        caret: 12,
    })
    assert.deepEqual(insertVariable('x {{', 2, 4, 'host'), {
        text: 'x {{host}}',
        caret: 10,
    })
})

test('matchVariables: names starting with the query come first', () => {
    const entries = [
        {
            name: 'BASE_URL',
            value: '',
        },
        {
            name: 'API_BASE',
            value: '',
        },
        {
            name: 'token',
            value: '',
        },
    ]
    assert.deepEqual(
        matchVariables(entries, 'base').map(({ name }) => name),
        ['BASE_URL', 'API_BASE'],
    )
    assert.equal(matchVariables(entries, '').length, 3)
})

test('placeholderAt finds the variable under a character', () => {
    assert.deepEqual(placeholderAt('{{API_BASE}}/api', 3), {
        start: 0,
        end: 12,
        name: 'API_BASE',
    })
    assert.equal(placeholderAt('{{API_BASE}}/api', 12), null)
})

test('usedVariables lists each name once, without the dynamic ones', () => {
    assert.deepEqual(usedVariables('{{a}}/{{ b }}/{{a}}/{{$guid}}'), ['a', 'b'])
    assert.deepEqual(usedVariables('no variables here'), [])
})
