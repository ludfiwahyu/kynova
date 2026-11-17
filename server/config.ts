import { isIP } from 'node:net'
import path from 'node:path'

import { DEFAULT_PORT, devApiPort } from '#shared/ports.ts'
import { MB } from '#shared/units.ts'

const host = process.env.HOST ?? '127.0.0.1'
const isLoopback =
    host === 'localhost' || host === '::1' || (isIP(host) === 4 && host.startsWith('127.'))

/**
 * Host names the server answers to. A web page can point its own domain at
 * 127.0.0.1 (DNS rebinding) and then talk to this server as a same-origin site;
 * checking the Host header refuses that. On a loopback bind the default is the
 * loopback names; otherwise set ALLOWED_HOSTS to the public name(s).
 */
function parseAllowedHosts(): string[] | null {
    const listed = process.env.ALLOWED_HOSTS?.split(',')
        .map((name) => name.trim().toLowerCase())
        .filter(Boolean)

    if (listed?.length) {
        return listed
    }

    return isLoopback ? ['localhost', '127.0.0.1', '::1'] : null
}

const dataDir = path.resolve(process.env.DATA_DIR ?? 'data')

const port = Number(process.env.PORT ?? DEFAULT_PORT)

/** `npm run dev:server` passes `--dev`: Vite serves the page on PORT, so the API moves up one. */
const isDevServer = process.argv.includes('--dev')

export const config = {
    host,
    port: isDevServer ? devApiPort(port) : port,
    dataDir,
    /** A postgres:// URL to use PostgreSQL; `null` uses the built-in SQLite database file. */
    databaseUrl: process.env.DATABASE_URL || null,
    databaseFile: path.join(dataDir, 'kynova.db'),
    backupDir: path.join(dataDir, 'backups'),
    /** The built web app. The desktop app points this at the copy inside its package. */
    staticDir: path.resolve(process.env.STATIC_DIR ?? 'dist'),
    isProduction: process.env.NODE_ENV === 'production',
    /** Secret for signing and encryption; set it in .env.local. */
    appSecret: process.env.APP_SECRET || null,
    secureCookie: process.env.COOKIE_SECURE === '1',
    /** `null` accepts any Host header. */
    allowedHosts: parseAllowedHosts(),

    /**
     * The request proxy can reach whatever this machine can. That is the point
     * when the server runs on your own computer, and a hazard when it is exposed
     * to others. Private targets are therefore allowed only on a loopback bind,
     * unless explicitly enabled.
     */
    allowPrivateTargets: isLoopback || process.env.ALLOW_PRIVATE_TARGETS === '1',

    sessionTtlMs: 30 * 24 * 60 * 60 * 1000,
    inviteTtlMs: 7 * 24 * 60 * 60 * 1000,
    maxJsonBytes: 5 * MB,
    maxResponseBytes: 10 * MB,
    /** Used when the sender's Settings leave the timeout at 0. */
    sendTimeoutMs: 30_000,
    /** The longest timeout a sender may ask for. */
    maxSendTimeoutMs: 5 * 60_000,
}
