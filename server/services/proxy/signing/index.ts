import { flagValue, textValue } from '#shared/auth.ts'
import { HEADER } from '#shared/http.ts'
import { STATUS } from '#shared/http.ts'
import type { SendAuth } from '#shared/types.ts'

import { signAwsV4 } from './awsv4.ts'
import { challengeFromValues, type DigestChallenge, signDigest } from './digest.ts'
import { signEdgegrid } from './edgegrid.ts'
import { signHawk } from './hawk.ts'
import { signAsap, signJwtBearer } from './jwt.ts'
import { authenticateMessage, negotiateMessage, parseChallengeMessage } from './ntlm.ts'
import { signOauth1 } from './oauth1.ts'
import { type Outgoing, parseChallenge, replaceHeader } from './outgoing.ts'

export type { Outgoing } from './outgoing.ts'

/** Signs a request whose auth needs nothing from the server. Digest and NTLM come back unchanged. */
export function signRequest(outgoing: Outgoing, auth: SendAuth): Outgoing {
    const { values } = auth

    switch (auth.type) {
        case 'hawk':
            return signHawk(outgoing, values)
        case 'jwt':
            return signJwtBearer(outgoing, values)
        case 'asap':
            return signAsap(outgoing, values)
        case 'oauth1':
            return signOauth1(outgoing, values)
        case 'edgegrid':
            return signEdgegrid(outgoing, values)
        case 'awsv4':
            return signAwsV4(outgoing, values)
        case 'digest': {
            // With realm and nonce filled in, the first request can carry the answer.
            const known = challengeFromValues(values)

            return known ? signDigest(outgoing, values, known) : outgoing
        }
        case 'ntlm':
            return outgoing
    }
}

/** A function that sends one leg of a request and returns its status and challenge headers. */
export interface Leg {
    status: number
    authenticate: string | null
    /** Throws away the body, so the connection can carry the next leg. */
    discard: () => Promise<void>
}

/**
 * For Digest: the request to send again after a 401 challenge, or null when the
 * response stands (no challenge, a challenge of another kind, or retrying is off).
 */
export function digestRetry(outgoing: Outgoing, auth: SendAuth, leg: Leg): Outgoing | null {
    if (
        auth.type !== 'digest' ||
        leg.status !== STATUS.unauthorized ||
        flagValue(auth.values, 'disableRetryRequest')
    ) {
        return null
    }

    const params = leg.authenticate ? parseChallenge(leg.authenticate, 'Digest') : null

    if (!params?.nonce) {
        return null
    }

    const challenge: DigestChallenge = {
        realm: params.realm ?? '',
        nonce: params.nonce,
        qop: params.qop,
        opaque: params.opaque,
        algorithm: params.algorithm,
    }

    return signDigest(outgoing, auth.values, challenge)
}

/** NTLM's first leg: the request with a negotiate message. */
export function ntlmNegotiate(outgoing: Outgoing): Outgoing {
    return replaceHeader(outgoing, HEADER.authorization, `NTLM ${negotiateMessage()}`)
}

/** NTLM's second leg, answering the server's challenge; null when the server sent none. */
export function ntlmAuthenticate(outgoing: Outgoing, auth: SendAuth, leg: Leg): Outgoing | null {
    const challenge =
        leg.status === STATUS.unauthorized && leg.authenticate
            ? parseChallengeMessage(leg.authenticate)
            : null

    if (!challenge) {
        return null
    }

    const message = authenticateMessage(
        {
            username: textValue(auth.values, 'username'),
            password: textValue(auth.values, 'password'),
            domain: textValue(auth.values, 'domain'),
            workstation: textValue(auth.values, 'workstation'),
        },
        challenge,
    )

    return replaceHeader(outgoing, HEADER.authorization, `NTLM ${message}`)
}
