import { createHmac, randomBytes } from 'node:crypto'

import { md4 } from './md4.ts'

const SIGNATURE = Buffer.from('NTLMSSP\0', 'latin1')

// Unicode, OEM, request target, NTLM, always sign, extended session security, target info, 128-bit, 56-bit.
const NEGOTIATE_FLAGS = 0xa0888207
const NEGOTIATE_UNICODE = 0x1

export interface NtlmCredentials {
    username: string
    password: string
    domain: string
    workstation: string
}

export interface NtlmChallenge {
    serverChallenge: Buffer
    targetInfo: Buffer
    flags: number
}

const utf16 = (text: string) => Buffer.from(text, 'utf16le')
const hmacMd5 = (key: Buffer, ...data: Buffer[]) =>
    createHmac('md5', key).update(Buffer.concat(data)).digest()

/** The first message: what the client supports. */
export function negotiateMessage(): string {
    const message = Buffer.alloc(32)

    SIGNATURE.copy(message)
    message.writeUInt32LE(1, 8)
    message.writeUInt32LE(NEGOTIATE_FLAGS, 12)
    // Domain and workstation are left empty (zero-length buffers at offset 32).
    message.writeUInt32LE(32, 20)
    message.writeUInt32LE(32, 28)

    return message.toString('base64')
}

/** Reads the server's challenge from `WWW-Authenticate: NTLM <base64>`. Null when it is not one. */
export function parseChallengeMessage(header: string): NtlmChallenge | null {
    const token = header.match(/NTLM\s+([A-Za-z0-9+/=]+)/i)?.[1]

    if (!token) {
        return null
    }

    const message = Buffer.from(token, 'base64')

    if (
        message.length < 32 ||
        !message.subarray(0, 8).equals(SIGNATURE) ||
        message.readUInt32LE(8) !== 2
    ) {
        return null
    }

    const flags = message.readUInt32LE(20)
    const serverChallenge = message.subarray(24, 32)
    let targetInfo = Buffer.alloc(0)

    if (message.length >= 48) {
        const length = message.readUInt16LE(40)
        const offset = message.readUInt32LE(44)

        if (offset + length <= message.length) {
            targetInfo = message.subarray(offset, offset + length)
        }
    }

    return {
        serverChallenge,
        targetInfo,
        flags,
    }
}

/** NTOWFv2: the key the NTLMv2 responses are computed with. */
export function ntlmV2Hash(username: string, password: string, domain: string): Buffer {
    return hmacMd5(md4(utf16(password)), utf16(username.toUpperCase() + domain))
}

/** The NTLMv2 and LMv2 responses. `time` is a Windows FILETIME (100 ns units since 1601). */
export function ntlmV2Responses(
    hash: Buffer,
    challenge: NtlmChallenge,
    clientChallenge: Buffer,
    time: bigint,
): {
    ntResponse: Buffer
    lmResponse: Buffer
} {
    const timestamp = Buffer.alloc(8)

    timestamp.writeBigUInt64LE(time)
    const blob = Buffer.concat([
        Buffer.from([1, 1, 0, 0, 0, 0, 0, 0]),
        timestamp,
        clientChallenge,
        Buffer.alloc(4),
        challenge.targetInfo,
        Buffer.alloc(4),
    ])
    const proof = hmacMd5(hash, challenge.serverChallenge, blob)

    return {
        ntResponse: Buffer.concat([proof, blob]),
        lmResponse: Buffer.concat([
            hmacMd5(hash, challenge.serverChallenge, clientChallenge),
            clientChallenge,
        ]),
    }
}

function fileTimeNow(): bigint {
    return (BigInt(Date.now()) + 11_644_473_600_000n) * 10_000n
}

/** The third message, answering the challenge with the credentials. */
export function authenticateMessage(
    credentials: NtlmCredentials,
    challenge: NtlmChallenge,
    clientChallenge = randomBytes(8),
    time = fileTimeNow(),
): string {
    const hash = ntlmV2Hash(credentials.username, credentials.password, credentials.domain)
    const { ntResponse, lmResponse } = ntlmV2Responses(hash, challenge, clientChallenge, time)
    const unicode = (challenge.flags & NEGOTIATE_UNICODE) !== 0
    const encode = (text: string) =>
        unicode ? utf16(text) : Buffer.from(text.toUpperCase(), 'latin1')

    const fields = [
        lmResponse,
        ntResponse,
        encode(credentials.domain),
        encode(credentials.username),
        encode(credentials.workstation),
        Buffer.alloc(0),
    ]
    const header = Buffer.alloc(64)

    SIGNATURE.copy(header)
    header.writeUInt32LE(3, 8)

    let offset = header.length

    fields.forEach((field, index) => {
        const at = 12 + index * 8

        header.writeUInt16LE(field.length, at)
        header.writeUInt16LE(field.length, at + 2)
        header.writeUInt32LE(offset, at + 4)
        offset += field.length
    })
    // `>>> 0`: bitwise results are signed in JavaScript, and the high flag bit would make this negative.
    header.writeUInt32LE((challenge.flags & NEGOTIATE_FLAGS) >>> 0, 60)

    return Buffer.concat([header, ...fields]).toString('base64')
}
