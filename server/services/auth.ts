import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage } from 'node:http'
import { promisify } from 'node:util'

import { config } from '#server/config.ts'
import { db } from '#server/database/index.ts'
import { HttpError } from '#server/http/router.ts'
import { STATUS } from '#shared/http.ts'
import type { User } from '#shared/types.ts'

const SESSION_COOKIE = 'kynova_session'
const MIN_PASSWORD_LENGTH = 8
const AVATAR_COLORS = [
    '#0f8f8f',
    '#c2571a',
    '#6b5fd3',
    '#b83a6b',
    '#3d8a3d',
    '#a8780c',
    '#2f74c0',
    '#8a4fb5',
]

// ── Passwords ────────────────────────────────────────────────────────────

// The async form runs on the thread pool, so hashing does not stall other requests.
const deriveKey = promisify(scrypt) as (
    password: string,
    salt: Buffer,
    length: number,
) => Promise<Buffer>

async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16)
    const hash = await deriveKey(password, salt, 64)

    return `${salt.toString('hex')}:${hash.toString('hex')}`
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
    const [salt, hash] = stored.split(':').map((part) => Buffer.from(part, 'hex'))

    return timingSafeEqual(await deriveKey(password, salt, hash.length), hash)
}

/** Checked against when the email is unknown, so both failures take the same time. */
const UNKNOWN_USER_HASH = hashPassword(randomBytes(16).toString('hex'))

// ── Accounts ─────────────────────────────────────────────────────────────

export async function register(email: string, name: string, password: string): Promise<User> {
    email = email.toLowerCase()

    if (!/^\S+@\S+\.\S+$/.test(email)) {
        throw new HttpError(STATUS.badRequest, 'Enter a valid email address.')
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
        throw new HttpError(
            STATUS.badRequest,
            `Password needs at least ${MIN_PASSWORD_LENGTH} characters.`,
        )
    }

    const user: User = {
        id: randomUUID(),
        email,
        name,
        color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    }
    const passwordHash = await hashPassword(password)

    // The insert itself decides, so two sign-ups racing for one email cannot both succeed.
    const { changes } = await db.run(
        `INSERT INTO users (id, email, name, color, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (email) DO NOTHING`,
        [user.id, user.email, user.name, user.color, passwordHash, Date.now()],
    )

    if (changes === 0) {
        throw new HttpError(STATUS.conflict, 'An account with this email already exists.')
    }

    return user
}

export async function login(email: string, password: string): Promise<User> {
    const row = await db.get<User & { password_hash: string }>(
        'SELECT id, email, name, color, password_hash FROM users WHERE email = ?',
        [email.toLowerCase()],
    )

    // Same message and timing for both failures, so sign-in does not reveal which emails have accounts.
    const isCorrect = await verifyPassword(
        password,
        row?.password_hash ?? (await UNKNOWN_USER_HASH),
    )

    if (!row || !isCorrect) {
        throw new HttpError(STATUS.unauthorized, 'Email or password is incorrect.')
    }

    return {
        id: row.id,
        email: row.email,
        name: row.name,
        color: row.color,
    }
}

// ── Sessions ─────────────────────────────────────────────────────────────

/** Only the hash is stored, so a leaked database cannot be replayed as cookies. */
function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
}

function readSessionToken(req: IncomingMessage): string | null {
    const cookies = req.headers.cookie?.split(';') ?? []

    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=')

        if (name === SESSION_COOKIE) {
            return value
        }
    }

    return null
}

function cookie(value: string, maxAgeSeconds: number): string {
    const secure = config.secureCookie ? '; Secure' : ''

    return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`
}

/** Starts a session and returns the `Set-Cookie` header value for it. */
export async function startSession(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex')

    await db.run('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)', [
        hashToken(token),
        userId,
        Date.now() + config.sessionTtlMs,
    ])

    return cookie(token, config.sessionTtlMs / 1000)
}

/** The `Set-Cookie` value that forgets the session, such as after picking another database. */
export function clearedSessionCookie(): string {
    return cookie('', 0)
}

/** Ends the request's session and returns the `Set-Cookie` header value that clears it. */
export async function endSession(req: IncomingMessage): Promise<string> {
    const token = readSessionToken(req)

    if (token) {
        await db.run('DELETE FROM sessions WHERE token_hash = ?', [hashToken(token)])
    }

    return cookie('', 0)
}

export async function currentUser(req: IncomingMessage): Promise<User | null> {
    const token = readSessionToken(req)

    if (!token) {
        return null
    }

    const user = await db.get<User>(
        `SELECT users.id, users.email, users.name, users.color
       FROM sessions JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ? AND sessions.expires_at > ?`,
        [hashToken(token), Date.now()],
    )

    return user ?? null
}

export async function requireUser(req: IncomingMessage): Promise<User> {
    const user = await currentUser(req)

    if (!user) {
        throw new HttpError(STATUS.unauthorized, 'Sign in to continue.')
    }

    return user
}

export async function purgeExpiredSessions(): Promise<void> {
    await db.run('DELETE FROM sessions WHERE expires_at <= ?', [Date.now()])
}
