import { createServer } from 'node:net'
import path from 'node:path'

import {
    app,
    BrowserWindow,
    dialog,
    ipcMain,
    Menu,
    type MenuItemConstructorOptions,
    nativeTheme,
    shell,
    utilityProcess,
} from 'electron'

import {
    DESKTOP_CHANNELS,
    DESKTOP_MENUS,
    type DesktopMenu,
    TITLE_BAR_HEIGHT,
} from '#shared/desktop.ts'

import { startUpdates } from './updates.ts'

const SERVER = path.join(__dirname, 'server', 'index.mjs')
const WEB_APP = path.join(__dirname, '..', 'dist')
const PRELOAD = path.join(__dirname, 'preload.cjs')
/** Kynova's own icon, for the window and taskbar where the installer has not set one (and for the Dock while developing). */
const ICON = path.join(app.getAppPath(), 'build', 'icon.png')
const IS_MAC = process.platform === 'darwin'
/** The traffic lights are about 14px tall; this centres them in the top bar. */
const TRAFFIC_LIGHTS = {
    x: 16,
    y: (TITLE_BAR_HEIGHT - 14) / 2,
}
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

/** The menus on Windows and Linux, which the page opens from its top bar. A Mac keeps Electron's menu bar at the top of the screen. */
const MENU_ITEMS: Record<DesktopMenu, MenuItemConstructorOptions[]> = {
    File: [
        { role: 'close' },
        { type: 'separator' },
        {
            role: 'quit',
            label: 'Exit',
        },
    ],
    Edit: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' },
    ],
    View: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
    ],
    Window: [{ role: 'minimize' }, { role: 'close' }],
}

/**
 * The window has no title bar of its own: the page's top bar takes its place. On a Mac the
 * traffic lights sit in it; on Windows and Linux the page draws its own window buttons at its
 * right end, so they zoom with the page, which the system's overlay buttons cannot.
 */
function titleBar(): Electron.BrowserWindowConstructorOptions {
    if (IS_MAC) {
        return {
            titleBarStyle: 'hidden',
            trafficLightPosition: TRAFFIC_LIGHTS,
        }
    }

    return {
        titleBarStyle: 'hidden',
        icon: ICON,
    }
}

/** Only the app's own page may open menus or act on the window. */
function fromApp(event: Electron.IpcMainEvent): BrowserWindow | null {
    if (!sameOrigin(event.senderFrame?.url ?? '')) {
        return null
    }

    return BrowserWindow.fromWebContents(event.sender)
}

function listenToPage(): void {
    ipcMain.on(DESKTOP_CHANNELS.openMenu, (event, x: unknown, y: unknown) => {
        const window = fromApp(event)
        const menu = Menu.getApplicationMenu()

        if (!window || !menu || typeof x !== 'number' || typeof y !== 'number') {
            return
        }

        // Page pixels grow with the zoom; the menu is placed in window pixels.
        const zoom = event.sender.getZoomFactor()

        menu.popup({
            window,
            x: Math.round(x * zoom),
            y: Math.round(y * zoom),
        })
    })

    ipcMain.on(DESKTOP_CHANNELS.windowAction, (event, action: unknown) => {
        const window = fromApp(event)

        if (!window) {
            return
        }

        if (action === 'minimize') {
            window.minimize()
        } else if (action === 'close') {
            window.close()
        } else if (action === 'toggleMaximize') {
            if (window.isMaximized()) {
                window.unmaximize()
            } else {
                window.maximize()
            }
        }
    })
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
        ...titleBar(),
        webPreferences: {
            ...SAFE_PAGE,
            preload: PRELOAD,
        },
    })

    window.once('ready-to-show', () => window.show())

    // The menus open from the page's top bar; their keys keep working while the bar is hidden.
    if (!IS_MAC) {
        window.setMenuBarVisibility(false)
    }

    // Without the title bar the traffic lights leave in full screen, and so does the room kept for them.
    window.on('enter-full-screen', () => window.webContents.send(DESKTOP_CHANNELS.fullScreen, true))
    window.on('leave-full-screen', () =>
        window.webContents.send(DESKTOP_CHANNELS.fullScreen, false),
    )

    const sendMaximized = () =>
        window.webContents.send(DESKTOP_CHANNELS.maximized, window.isMaximized())

    window.on('maximize', sendMaximized)
    window.on('unmaximize', sendMaximized)
    window.webContents.on('did-finish-load', sendMaximized)

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
            if (IS_MAC && !app.isPackaged) {
                app.dock?.setIcon(ICON)
            }

            if (!IS_MAC) {
                Menu.setApplicationMenu(
                    Menu.buildFromTemplate(
                        DESKTOP_MENUS.map((label) => ({
                            label,
                            submenu: MENU_ITEMS[label],
                        })),
                    ),
                )
            }

            listenToPage()
            await startServer()
            openWindow()

            if (process.platform === 'win32') {
                startUpdates(fromApp)
            }

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
