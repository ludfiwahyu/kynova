/** JSON Web Tokens (RFC 7519): the "JWT Bearer" type and Atlassian's ASAP. */
import { constants, createHmac, randomUUID, sign } from 'node:crypto'

import { HttpError } from '#server/http/router.ts'
import { flagValue, textValue } from '#shared/auth.ts'
import { HEADER, STATUS } from '#shared/http.ts'
import type { AuthValues } from '#shared/types.ts'

import { type Outgoing, withHeader, withQuery } from './outgoing.ts'

const DIGESTS: Record<string, string> = {
    '256': 'sha256',
    '384': 'sha384',
    '512': 'sha512',
}

export const JWT_ALGORITHMS = [
    'HS256',
    'HS384',
    'HS512',
    'RS256',
    'RS384',
    'RS512',
    'PS256',
    'PS384',
    'PS512',
    'ES256',
    'ES384',
    'ES512',
]

const base64url = (data: string | Buffer) => Buffer.from(data).toString('base64url')

function parseObject(text: string, what: string): Record<string, unknown> {
    if (!text.trim()) {
        return {}
    }

    let value: unknown

    try {
        value = JSON.parse(text)
    } catch {
        throw new HttpError(STATUS.badRequest, `The ${what} is not valid JSON.`)
    }

    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new HttpError(STATUS.badRequest, `The ${what} must be a JSON object.`)
    }

    return value as Record<string, unknown>
}

/** Signs `header.payload` with HMAC (a secret) or with a private key (RSA, RSA-PSS, ECDSA). */
export function signJwt(
    algorithm: string,
    header: Record<string, unknown>,
    payload: Record<string, unknown>,
    key: string | Buffer,
): string {
    if (!JWT_ALGORITHMS.includes(algorithm)) {
        throw new HttpError(
            STATUS.badRequest,
            `${algorithm} is not a JWT algorithm Kynova can sign with.`,
        )
    }

    const input = `${base64url(
        JSON.stringify({
            ...header,
            alg: algorithm,
        }),
    )}.${base64url(JSON.stringify(payload))}`
    const digest = DIGESTS[algorithm.slice(2)]

    let signature: Buffer

    try {
        if (algorithm.startsWith('HS')) {
            signature = createHmac(digest, key).update(input).digest()
        } else if (algorithm.startsWith('RS')) {
            signature = sign(digest, Buffer.from(input), key)
        } else if (algorithm.startsWith('PS')) {
            signature = sign(digest, Buffer.from(input), {
                key,
                padding: constants.RSA_PKCS1_PSS_PADDING,
                saltLength: constants.RSA_PSS_SALTLEN_DIGEST,
            })
        } else {
            signature = sign(digest, Buffer.from(input), {
                key,
                dsaEncoding: 'ieee-p1363',
            })
        }
    } catch {
        throw new HttpError(
            STATUS.badRequest,
            `The ${algorithm.startsWith('HS') ? 'secret' : 'private key'} could not sign the token. Check that it is a PEM key of the right type.`,
        )
    }

    return `${input}.${base64url(signature)}`
}

/** JWT Bearer: the user's payload and headers, signed, sent as a header or a query param. */
export function signJwtBearer(outgoing: Outgoing, values: AuthValues): Outgoing {
    const algorithm = textValue(values, 'algorithm', 'HS256')
    const secret = textValue(values, 'secret')
    const secretIsBase64 = flagValue(values, 'isSecretBase64Encoded')
    const hmacKey = secretIsBase64 ? Buffer.from(secret, 'base64') : secret
    const key = algorithm.startsWith('HS') ? hmacKey : textValue(values, 'privateKey')

    const token = signJwt(
        algorithm,
        {
            typ: 'JWT',
            ...parseObject(textValue(values, 'header'), 'JWT header'),
        },
        parseObject(textValue(values, 'payload'), 'JWT payload'),
        key,
    )

    if (textValue(values, 'addTokenTo') === 'queryParam') {
        return withQuery(outgoing, [[textValue(values, 'queryParamKey', 'token'), token]])
    }

    const prefix = textValue(values, 'headerPrefix', 'Bearer').trim()

    return withHeader(outgoing, HEADER.authorization, prefix ? `${prefix} ${token}` : token)
}

/** "1h", "30m", "45s", "2d" or plain seconds, in seconds. */
function parseExpiry(text: string): number {
    const match = text.trim().match(/^(\d+)\s*([smhd]?)$/i)

    if (!match) {
        return 3600
    }

    return (
        Number(match[1]) *
        {
            '': 1,
            s: 1,
            m: 60,
            h: 3600,
            d: 86400,
        }[match[2].toLowerCase() as '' | 's' | 'm' | 'h' | 'd']
    )
}

/** Atlassian Service Authentication Protocol: a short-lived token signed with the service's private key. */
export function signAsap(outgoing: Outgoing, values: AuthValues, now = Date.now()): Outgoing {
    const issuedAt = Math.floor(now / 1000)
    const issuer = textValue(values, 'iss')
    const claims = {
        iss: issuer,
        sub: textValue(values, 'sub') || issuer,
        aud: textValue(values, 'aud'),
        jti: randomUUID(),
        iat: issuedAt,
        exp: issuedAt + parseExpiry(textValue(values, 'exp', '1h')),
        ...parseObject(textValue(values, 'claims'), 'additional claims'),
    }
    const token = signJwt(
        textValue(values, 'alg', 'RS256'),
        {
            typ: 'JWT',
            kid: textValue(values, 'kid'),
        },
        claims,
        textValue(values, 'privateKey'),
    )

    return withHeader(outgoing, HEADER.authorization, `Bearer ${token}`)
}
