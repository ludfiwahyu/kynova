import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

/**
 * Proxies to the Kynova server and keeps the browser's `Host` header. The server
 * compares `Origin` with `Host` to block cross-site requests, and the proxy
 * would otherwise replace `Host` with the server's own address.
 */
function toServer(target: string): ProxyOptions {
    return {
        target,
        ws: true,
        configure(proxy) {
            proxy.on('proxyReq', (proxyReq, req) =>
                proxyReq.setHeader('host', req.headers.host ?? ''),
            )
            proxy.on('proxyReqWs', (proxyReq, req) =>
                proxyReq.setHeader('host', req.headers.host ?? ''),
            )
        },
    }
}

/** `--mode mac` and `--mode win` are the desktop builds; `--mode desktop` takes the host's system. */
function appPlatform(mode: string, fromEnv: string | undefined) {
    if (mode === 'mac') {
        return 'MAC'
    }

    if (mode === 'win') {
        return 'WIN'
    }

    if (mode === 'desktop') {
        return process.platform === 'win32' ? 'WIN' : 'MAC'
    }

    return fromEnv || 'WEB'
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    const server = toServer(env.VITE_API_BASE_URL || `http://127.0.0.1:${env.PORT || 8787}`)

    return {
        plugins: [react(), tailwindcss()],
        // `@/components` is `src/components`; `#shared/...` comes from package.json "imports".
        resolve: {
            alias: [
                {
                    find: /^@\//,
                    replacement: fileURLToPath(new URL('./src/', import.meta.url)),
                },
            ],
        },
        define: {
            // Shown in Settings › About.
            __APP_VERSION__: JSON.stringify(version),
            __APP_PLATFORM__: JSON.stringify(appPlatform(mode, env.VITE_APP_APPLICATION)),
        },
        // The server's Content-Security-Policy does not allow data: URIs for fonts,
        // so small assets must stay separate files instead of being inlined.
        // The main bundle is 525 KB (127 KB gzip); the editor loads on first use.
        build: {
            assetsInlineLimit: 0,
            chunkSizeWarningLimit: 600,
        },
        server: {
            proxy: {
                '/api': server,
                '/ws': server,
            },
        },
    }
})
