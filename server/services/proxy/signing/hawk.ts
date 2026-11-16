/** Hawk authentication (https://github.com/mozilla/hawk), the `Authorization: Hawk …` header. */
import { createHash, createHmac, randomBytes } from 'node:crypto'

import { flagValue, textValue } from '#shared/auth.ts'
import { HEADER } from '#shared/http.ts'
import type { AuthValues } from '#shared/types.ts'

import { getHeader, type Outgoing, quoted, withHeader } from './outgoing.ts'

const ALGORITHMS: Record<string, string> = {
    sha256: 'sha256',
    sha1: 'sha1',
}

function payloadHash(algorithm: string, contentType: string, payload: string): string {
    const type = contentType.split(';')[0].trim().toLowerCase()

    return createHash(algorithm).update(`hawk.1.payload\n${type}\n${payload}\n`).digest('base64')
}

export function hawkHeader(outgoing: Outgoing, values: AuthValues, now = Date.now()): string {
    const algorithm = ALGORITHMS[textValue(values, 'algorithm', 'sha256').toLowerCase()] ?? 'sha256'
    const timestamp = textValue(values, 'timestamp') || String(Math.floor(now / 1000))
    const nonce = textValue(values, 'nonce') || randomBytes(6).toString('base64url')
    const ext = textValue(values, 'extraData')
    const app = textValue(values, 'app')
    const dlg = textValue(values, 'delegation')
    const { url } = outgoing
    const port = url.port || (url.protocol === 'https:' ? '443' : '80')
    const hash = flagValue(values, 'includePayloadHash')
        ? payloadHash(algorithm, getHeader(outgoing, 'content-type') ?? '', outgoing.body ?? '')
        : ''

    const normalized =
        [
            'hawk.1.header',
            timestamp,
            nonce,
            outgoing.method.toUpperCase(),
            url.pathname + url.search,
            url.hostname.toLowerCase(),
            port,
            hash,
            ext.replace(/\\/g, '\\\\').replace(/\n/g, '\\n'),
        ].join('\n') +
        '\n' +
        (app ? `${app}\n${dlg}\n` : '')
    const mac = createHmac(algorithm, textValue(values, 'authKey'))
        .update(normalized)
        .digest('base64')

    const parts = [
        `id=${quoted(textValue(values, 'authId'))}`,
        `ts=${quoted(timestamp)}`,
        `nonce=${quoted(nonce)}`,
        ...(hash ? [`hash=${quoted(hash)}`] : []),
        ...(ext ? [`ext=${quoted(ext)}`] : []),
        `mac=${quoted(mac)}`,
        ...(app ? [`app=${quoted(app)}`] : []),
        ...(app && dlg ? [`dlg=${quoted(dlg)}`] : []),
    ]

    return `Hawk ${parts.join(', ')}`
}

export function signHawk(outgoing: Outgoing, values: AuthValues, now?: number): Outgoing {
    return withHeader(outgoing, HEADER.authorization, hawkHeader(outgoing, values, now))
}
