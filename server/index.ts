import { createServer } from 'node:http'

import { HEADER, MIME } from '#shared/http.ts'

import { config } from './config.ts'
import { runIn } from './database/context.ts'
import { localTarget, openTargets } from './database/targets.ts'
import { handleApi, isAllowedHost } from './http/router.ts'
import { serveStatic } from './http/static.ts'
import { authRoutes } from './routes/auth.ts'
import { databaseRoutes } from './routes/database.ts'
import { sendRoutes } from './routes/send.ts'
import { workspaceRoutes } from './routes/workspaces.ts'
import { purgeExpiredSessions } from './services/auth.ts'
import { attachRealtime } from './services/realtime.ts'
import { purgeExpiredInvites } from './services/workspaces.ts'

const routes = [...authRoutes, ...databaseRoutes, ...workspaceRoutes, ...sendRoutes]
const PURGE_INTERVAL_MS = 60 * 60 * 1000

const server = createServer((req, res) => {
    if (!isAllowedHost(req)) {
        res.writeHead(421, { [HEADER.contentType]: MIME.text }).end(
            'This server does not answer to that host name.',
        )

        return
    }

    const { pathname } = new URL(req.url ?? '/', 'http://localhost')

    if (pathname.startsWith('/api/')) {
        void handleApi(routes, req, res)
    } else {
        serveStatic(pathname, res)
    }
})

attachRealtime(server)

// The local database opens now, so a broken setup stops the server here rather than on the first request.
const local = await localTarget()

/** Clears expired sessions and invites in every database open on this server. */
function purgeExpired(): void {
    openTargets()
        .then((targets) =>
            Promise.all(
                targets.map((target) =>
                    runIn(target, () =>
                        Promise.all([purgeExpiredSessions(), purgeExpiredInvites()]),
                    ),
                ),
            ),
        )
        .catch((error) => console.error(error))
}

purgeExpired()
setInterval(purgeExpired, PURGE_INTERVAL_MS).unref()

server.listen(config.port, config.host, () => {
    const engineNames = {
        sqlite: `SQLite at ${config.databaseFile}`,
        mysql: 'MySQL',
        postgres: 'PostgreSQL',
    }
    const database = engineNames[local.db.engine]

    console.log(
        `Kynova server listening on http://${config.host}:${config.port}, using ${database} as the local database`,
    )

    if (!config.allowPrivateTargets) {
        console.log('Requests to private network addresses are blocked.')
    }

    if (!config.allowedHosts) {
        console.warn('ALLOWED_HOSTS is not set, so any Host header is accepted.')
    }
})
