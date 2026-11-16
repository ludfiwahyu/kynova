import assert from 'node:assert/strict'
import { test } from 'node:test'

import { api } from '@/services'
import type { SendRequest, SendResponse } from '#shared/types.ts'

import { clearConsole, isProblem, sendLogged, useConsole } from './console'

const request: SendRequest = {
    method: 'POST',
    url: 'https://api.dev/x',
    headers: [['A', '1']],
    body: 'x'.repeat(70 * 1024),
}
const response = (status: number): SendResponse => ({
    status,
    statusText: '',
    headers: [],
    body: 'ok',
    bodyIsBase64: false,
    truncated: false,
    limitBytes: 0,
    sizeBytes: 2,
    timeMs: 5,
})

test('logs each exchange and each failure, with long bodies cut', async () => {
    clearConsole()
    const original = api.send
    try {
        api.send = async () => response(200)
        await sendLogged(request, 'Create order', 'item-1')
        api.send = async () => response(500)
        await sendLogged(request, 'Create order', 'item-1')
        api.send = async () => {
            throw new Error('Could not get a response: ECONNREFUSED')
        }
        await assert.rejects(sendLogged(request, 'OAuth 2.0 token request'), /ECONNREFUSED/)
    } finally {
        api.send = original
    }

    const entries = useConsole.getState().entries
    assert.deepEqual(
        entries.map((entry) => [
            entry.source,
            entry.response?.status ?? entry.error,
            isProblem(entry),
        ]),
        [
            ['Create order', 200, false],
            ['Create order', 500, true],
            ['OAuth 2.0 token request', 'Could not get a response: ECONNREFUSED', true],
        ],
    )
    assert.ok(entries[0].request.body!.length < 66 * 1024)
    assert.match(entries[0].request.body!, /cut off at 64 KB in the Console$/)
    assert.equal(request.body!.length, 70 * 1024, 'the sent request is not changed')
})

test('keeps the latest 300 entries', async () => {
    clearConsole()
    const original = api.send
    api.send = async () => response(200)
    try {
        for (let index = 0; index < 305; index++) {
            await sendLogged(
                {
                    ...request,
                    body: null,
                    url: `https://api.dev/${index}`,
                },
                'r',
            )
        }
    } finally {
        api.send = original
    }
    const entries = useConsole.getState().entries
    assert.equal(entries.length, 300)
    assert.equal(entries[0].request.url, 'https://api.dev/5')
})
