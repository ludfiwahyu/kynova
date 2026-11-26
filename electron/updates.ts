import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'

import { DESKTOP_CHANNELS, type UpdateState } from '#shared/desktop.ts'

let state: UpdateState = { status: 'idle' }
/** The check made at start asks with a dialog; one made in Settings shows its answer there. */
let askAtStart = true

function setState(next: UpdateState): void {
    state = next

    for (const window of BrowserWindow.getAllWindows()) {
        window.webContents.send(DESKTOP_CHANNELS.updateState, state)
        window.setProgressBar(state.status === 'downloading' ? state.percent / 100 : -1)
    }
}

async function confirm(message: string, detail: string, action: string): Promise<boolean> {
    const { response } = await dialog.showMessageBox({
        type: 'info',
        message,
        detail,
        buttons: [action, 'Later'],
        defaultId: 0,
        cancelId: 1,
    })

    return response === 0
}

// A failure is also reported as an `error` event, which sets the state.
function check(): void {
    void autoUpdater.checkForUpdates().catch(() => {})
}

function download(): void {
    setState({
        status: 'downloading',
        percent: 0,
    })
    void autoUpdater.downloadUpdate().catch(() => {})
}

function listenToUpdater(): void {
    autoUpdater.autoDownload = false

    autoUpdater.on('checking-for-update', () => setState({ status: 'checking' }))
    autoUpdater.on('update-not-available', () => setState({ status: 'latest' }))
    autoUpdater.on('error', (error) => {
        console.error('Update failed:', error)
        setState({
            status: 'error',
            message: 'Could not reach the update. Check your connection and try again.',
        })
    })
    autoUpdater.on('download-progress', ({ percent }) =>
        setState({
            status: 'downloading',
            percent: Math.round(percent),
        }),
    )

    autoUpdater.on('update-available', ({ version }) => {
        setState({
            status: 'available',
            version,
        })

        if (!askAtStart) {
            return
        }

        void confirm(
            `Kynova ${version} is available`,
            `You have ${app.getVersion()}. Your data stays as it is.`,
            'Download',
        ).then((agreed) => {
            if (agreed) {
                download()
            }
        })
    })

    autoUpdater.on('update-downloaded', ({ version }) => {
        setState({
            status: 'ready',
            version,
        })

        void confirm(
            `Kynova ${version} is ready to install`,
            'Restart now, or it installs when you quit.',
            'Restart now',
        ).then((agreed) => {
            if (agreed) {
                autoUpdater.quitAndInstall()
            }
        })
    })
}

/** Keeps the installed app up to date from the project's releases, asking before it acts. */
export function startUpdates(
    fromApp: (event: Electron.IpcMainEvent) => BrowserWindow | null,
): void {
    if (!app.isPackaged) {
        state = { status: 'unsupported' }
    }

    ipcMain.on(DESKTOP_CHANNELS.updateWatch, (event) => {
        if (fromApp(event)) {
            event.sender.send(DESKTOP_CHANNELS.updateState, state)
        }
    })

    if (!app.isPackaged) {
        return
    }

    ipcMain.on(DESKTOP_CHANNELS.updateAction, (event, action: unknown) => {
        if (!fromApp(event)) {
            return
        }

        if (action === 'check' && state.status !== 'downloading' && state.status !== 'ready') {
            askAtStart = false
            check()
        } else if (action === 'download' && state.status === 'available') {
            download()
        } else if (action === 'install' && state.status === 'ready') {
            autoUpdater.quitAndInstall()
        }
    })

    listenToUpdater()
    check()
}
