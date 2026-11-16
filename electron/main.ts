import { createServer } from 'node:net'
import path from 'node:path'

import { app, BrowserWindow, dialog, nativeTheme, shell, utilityProcess } from 'electron'

const SERVER = path.join(__dirname, 'server', 'index.mjs')
const WEB_APP = path.join(__dirname, '..', 'dist')
/** The OAuth 2.0 sign-in window the web app opens (`window.open(..., 'kynova-oauth2')`). */
const OAUTH_WINDOW = 'kynova-oauth2'

// KYNOVA_USER_DATA puts everything the app keeps (database, sign-in, window state) in
// another folder, such as a USB stick or a test's scratch folder.
if (process.env.KYNOVA_USER_DATA) {
    app.setPath('userData', process.env.KYNOVA_USER_DATA)
}

/** Live coding: `npm run desktop:dev` points the window at the Vite dev server instead of the bundled one. */
const DEV_URL = process.env.KYNOVA_DEV_URL

let server: Electron.UtilityProcess | null = null
let origin = ''
let quitting = false

/** A port nothing else uses right now, on this computer only. */
function freePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const probe = createServer()

        probe.once('error', reject)
        probe.listen(0, '127.0.0.1', () => {
            const { port } = probe.address() as { port: number }

            probe.close(() => resolve(port))
        })
    })
}

/** Waits until the server answers, for at most `timeoutMs`. */
async function whenAnswering(url: string, timeoutMs = 20_000): Promise<void> {
    const deadline = Date.now() + timeoutMs

    while (Date.now() < deadline) {
        try {
            const response = await fetch(url)

            if (response.ok) {
                return
            }
        } catch {
            // Not listening yet.
        }

        await new Promise((resolve) => setTimeout(resolve, 150))
    }

    throw new Error('The Kynova server did not start in time.')
}

async function startServer(): Promise<void> {
    if (DEV_URL) {
        origin = new URL(DEV_URL).origin

        await whenAnswering(origin, 60_000)

        return
    }

    const port = await freePort()

    origin = `http://127.0.0.1:${port}`

    server = utilityProcess.fork(SERVER, [], {
        serviceName: 'Kynova server',
        stdio: 'inherit',
        env: {
            ...process.env,
            NODE_ENV: 'production',
            HOST: '127.0.0.1',
            PORT: String(port),
            DATA_DIR: path.join(app.getPath('userData'), 'data'),
            STATIC_DIR: WEB_APP,
        },
    })

    server.on('exit', (code) => {
        if (quitting) {
            return
        }

        dialog.showErrorBox(
            'Kynova stopped',
            `The Kynova server stopped (code ${code}). Your data is safe; start Kynova again.`,
        )
        app.quit()
    })

    await whenAnswering(origin)
}

function sameOrigin(url: string): boolean {
    try {
        return new URL(url).origin === origin
    } catch {
        return false
    }
}

/** http and https links open in the system browser; nothing else opens at all. */
function openOutside(url: string): void {
    if (/^https?:\/\//i.test(url)) {
        void shell.openExternal(url)
    }
}

const SAFE_PAGE: Electron.WebPreferences = {
    contextIsolation: true,
    sandbox: true,
    nodeIntegration: false,
}

function openWindow(): BrowserWindow {
    const window = new BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 960,
        minHeight: 600,
        title: 'Kynova',
        show: false,
        backgroundColor: nativeTheme.shouldUseDarkColors ? '#212121' : '#ffffff',
        webPreferences: SAFE_PAGE,
    })

    window.once('ready-to-show', () => window.show())

    // ⌘= or Ctrl+= zooms in, as in browsers. Electron's own menu only takes ⌘+ (Shift on most
    // keyboards); its ⌘- and ⌘0 already match. The step is the menu's.
    window.webContents.on('before-input-event', (event, input) => {
        const mod = process.platform === 'darwin' ? input.meta : input.control

        if (input.type === 'keyDown' && mod && !input.shift && !input.alt && input.key === '=') {
            event.preventDefault()
            window.webContents.setZoomLevel(window.webContents.getZoomLevel() + 0.5)
        }
    })

    // The app stays on its own server; anything else opens in the browser.
    window.webContents.on('will-navigate', (event, url) => {
        if (sameOrigin(url)) {
            return
        }

        event.preventDefault()
        openOutside(url)
    })

    window.webContents.setWindowOpenHandler(({ url, frameName }) => {
        // OAuth 2.0 sign-in happens in a window of the app, so the app can read where it lands.
        if (frameName === OAUTH_WINDOW || sameOrigin(url)) {
            return {
                action: 'allow',
                overrideBrowserWindowOptions: {
                    webPreferences: SAFE_PAGE,
                    autoHideMenuBar: true,
                },
            }
        }

        openOutside(url)

        return { action: 'deny' }
    })

    void window.loadURL(origin)

    return window
}

// One Kynova at a time: a second server would share the same database file.
if (!app.requestSingleInstanceLock()) {
    app.quit()
} else {
    app.on('second-instance', () => {
        const [window] = BrowserWindow.getAllWindows()

        if (!window) {
            return
        }

        if (window.isMinimized()) {
            window.restore()
        }

        window.focus()
    })

    app.whenReady()
        .then(async () => {
            await startServer()
            openWindow()

            // On a Mac the app stays open without windows; the Dock icon opens one again.
            app.on('activate', () => {
                if (BrowserWindow.getAllWindows().length === 0) {
                    openWindow()
                }
            })
        })
        .catch((error: Error) => {
            dialog.showErrorBox('Kynova could not start', error.message)
            app.quit()
        })

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit()
        }
    })

    app.on('before-quit', () => {
        quitting = true
        server?.kill()
    })
}
