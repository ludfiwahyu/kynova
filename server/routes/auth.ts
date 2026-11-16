import { clientAddress, createRateLimit } from '#server/http/rateLimit.ts'
import { readJson, route, stringField } from '#server/http/router.ts'
import { currentUser, endSession, login, register, startSession } from '#server/services/auth.ts'
import { listWorkspaces } from '#server/services/workspaces.ts'

const MAX_PASSWORD_LENGTH = 200

/** Sign-in and registration attempts per address: slows down password guessing. */
const authAttempt = createRateLimit(20, 15 * 60 * 1000)

export const authRoutes = [
    route('POST', '/api/auth/register', async ({ req, res }) => {
        authAttempt(clientAddress(req))
        const body = await readJson(req)
        const user = await register(
            stringField(body, 'email'),
            stringField(body, 'name', 60),
            stringField(body, 'password', MAX_PASSWORD_LENGTH),
        )

        res.setHeader('Set-Cookie', await startSession(user.id))

        return { user }
    }),

    route('POST', '/api/auth/login', async ({ req, res }) => {
        authAttempt(clientAddress(req))
        const body = await readJson(req)
        const user = await login(
            stringField(body, 'email'),
            stringField(body, 'password', MAX_PASSWORD_LENGTH),
        )

        res.setHeader('Set-Cookie', await startSession(user.id))

        return { user }
    }),

    route('POST', '/api/auth/logout', async ({ req, res }) => {
        res.setHeader('Set-Cookie', await endSession(req))
    }),

    /** The signed-in user and their workspaces, or `{ user: null }` when signed out. */
    route('GET', '/api/me', async ({ req }) => {
        const user = await currentUser(req)

        return user
            ? {
                  user,
                  workspaces: await listWorkspaces(user.id),
              }
            : {
                  user: null,
                  workspaces: [],
              }
    }),
]
