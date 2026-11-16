import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createRateLimit } from './rateLimit.ts'
import { HttpError } from './router.ts'

test('allows up to the limit, then refuses with 429', () => {
    const attempt = createRateLimit(3, 60_000)
    for (let i = 0; i < 3; i++) {
        attempt('1.2.3.4')
    }

    assert.throws(
        () => attempt('1.2.3.4'),
        (error: unknown) =>
            error instanceof HttpError &&
            error.status === 429 &&
            /Try again in 1 minute\./.test(error.message),
    )
})

test('counts each key separately', () => {
    const attempt = createRateLimit(1, 60_000)
    attempt('a')
    assert.doesNotThrow(() => attempt('b'))
})

test('starts a new window once the old one has passed', (t) => {
    t.mock.timers.enable({ apis: ['Date'] })
    const attempt = createRateLimit(1, 1000)
    attempt('a')
    assert.throws(() => attempt('a'))

    t.mock.timers.tick(1001)
    assert.doesNotThrow(() => attempt('a'))
})
