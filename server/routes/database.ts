import { runIn, statusOf } from '#server/database/context.ts'
import {
    connectTarget,
    describeTarget,
    localTarget,
    readTargetCookie,
    requestTarget,
    type SslMode,
    targetById,
    targetCookie,
    type TargetInput,
    testTarget,
} from '#server/database/targets.ts'
import { clientAddress, createRateLimit } from '#server/http/rateLimit.ts'
import { HttpError, readJson, route, stringField } from '#server/http/router.ts'
import { clearedSessionCookie, endSession } from '#server/services/auth.ts'
import { STATUS } from '#shared/http.ts'

/** Connection attempts per address: each one makes this server dial out. */
const connectAttempt = createRateLimit(30, 15 * 60 * 1000)

const MAX_URL_LENGTH = 2000
const MAX_CA_LENGTH = 20_000

function readInput(body: Record<string, unknown>): TargetInput {
    const ssl = body.ssl ?? 'verify'

    if (ssl !== 'verify' && ssl !== 'require' && ssl !== 'off') {
        throw new HttpError(STATUS.badRequest, 'Choose how to use SSL.')
    }

    const ca = body.ca

    if (ca !== undefined && (typeof ca !== 'string' || ca.length > MAX_CA_LENGTH)) {
        throw new HttpError(STATUS.badRequest, 'The certificate is not valid text.')
    }

    return {
        url: stringField(body, 'url', MAX_URL_LENGTH),
        ssl: ssl as SslMode,
        ...(ca && { ca }),
    }
}

/** Signs out of the database being left, when it can be reached. The cookie goes either way. */
async function resolveTarget(body: Record<string, unknown>) {
    if (body.local === true) {
        return localTarget()
    }

    if (typeof body.id !== 'string') {
        return connectTarget(readInput(body))
    }

    const known = await targetById(body.id)

    if (!known) {
        throw new HttpError(
            STATUS.notFound,
            'That database is no longer known to this server. Enter its connection string again.',
        )
    }

    return known
}

async function leaveCurrent(req: Parameters<typeof endSession>[0]): Promise<void> {
    try {
        await runIn(await requestTarget(req), () => endSession(req))
    } catch {
        // An unreachable database keeps its session row until it expires.
    }
}

export const databaseRoutes = [
    /** The database this person uses, for the top bar and the sign-in screen. */
    route(
        'GET',
        '/api/database',
        async ({ req }) => {
            try {
                return { database: statusOf(await requestTarget(req)) }
            } catch (error) {
                return {
                    database: describeTarget(readTargetCookie(req)),
                    error: (error as Error).message,
                }
            }
        },
        { usesDatabase: false },
    ),

    /** Tries a connection string without changing anything. */
    route(
        'POST',
        '/api/database/test',
        async ({ req }) => {
            connectAttempt(clientAddress(req))

            return testTarget(readInput(await readJson(req)))
        },
        { usesDatabase: false },
    ),

    /**
     * Switches this browser to another database: the local one (`{ local: true }`),
     * one used before (`{ id }`), or a new connection string. Signs out, since
     * accounts belong to a database.
     */
    route(
        'POST',
        '/api/database/use',
        async ({ req, res }) => {
            connectAttempt(clientAddress(req))
            const body = await readJson(req)
            const target = await resolveTarget(body)

            await leaveCurrent(req)
            res.setHeader('Set-Cookie', [targetCookie(target.id), clearedSessionCookie()])

            return { database: statusOf(target) }
        },
        { usesDatabase: false },
    ),
]
