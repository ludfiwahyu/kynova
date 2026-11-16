import { createReadStream, existsSync, statSync } from 'node:fs'
import type { ServerResponse } from 'node:http'
import path from 'node:path'

import { config } from '#server/config.ts'
import { HEADER, MIME, STATUS } from '#shared/http.ts'

/**
 * Limits what the page may load or connect to. `connect-src` stays open to
 * ws: and wss: because the WebSocket tool connects to any server the user names.
 */
const SECURITY_HEADERS = {
    'Content-Security-Policy': [
        "default-src 'self'",
        "connect-src 'self' ws: wss:",
        "img-src 'self' data:",
        "style-src 'self' 'unsafe-inline'",
        "object-src 'none'",
        "base-uri 'none'",
        "frame-ancestors 'none'",
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
}

const CONTENT_TYPES: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': MIME.jsonUtf8,
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
}

function isFile(filePath: string): boolean {
    return existsSync(filePath) && statSync(filePath).isFile()
}

/** Serves the built client. Unknown paths get `index.html`, so client-side routes work. */
export function serveStatic(pathname: string, res: ServerResponse): void {
    let decoded: string

    try {
        decoded = decodeURIComponent(pathname)
    } catch {
        res.writeHead(STATUS.badRequest, { [HEADER.contentType]: MIME.text }).end('Malformed URL.')

        return
    }

    const requested = path.join(config.staticDir, path.normalize(decoded))
    const isInsideStaticDir = requested.startsWith(config.staticDir + path.sep)
    const filePath =
        isInsideStaticDir && isFile(requested)
            ? requested
            : path.join(config.staticDir, 'index.html')

    if (!isFile(filePath)) {
        res.writeHead(STATUS.notFound, { [HEADER.contentType]: MIME.text }).end(
            'Client is not built. Run "npm run build".',
        )

        return
    }

    res.writeHead(200, {
        ...SECURITY_HEADERS,
        [HEADER.contentType]: CONTENT_TYPES[path.extname(filePath)] ?? MIME.binary,
    })
    createReadStream(filePath).pipe(res)
}
