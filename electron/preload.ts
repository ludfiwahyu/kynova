import { contextBridge, ipcRenderer } from 'electron'

import {
    DESKTOP_CHANNELS,
    type DesktopUpdates,
    type KynovaDesktop,
    type UpdateState,
} from '#shared/desktop.ts'

// Remembered here, so a button drawn later (in a dialog) starts with the right icon.
let isMaximized = false
const maximizedListeners = new Set<(isMaximized: boolean) => void>()

ipcRenderer.on(DESKTOP_CHANNELS.maximized, (_event, value: boolean) => {
    isMaximized = value
    maximizedListeners.forEach((listener) => listener(value))
})

const updates: DesktopUpdates = {
    run: (action) => ipcRenderer.send(DESKTOP_CHANNELS.updateAction, action),
    onState: (listener) => {
        const handle = (_event: Electron.IpcRendererEvent, state: UpdateState) => listener(state)

        ipcRenderer.on(DESKTOP_CHANNELS.updateState, handle)
        // Asks for the state as it is now, which arrives the same way.
        ipcRenderer.send(DESKTOP_CHANNELS.updateWatch)

        return () => ipcRenderer.removeListener(DESKTOP_CHANNELS.updateState, handle)
    },
}

// The page gets these few calls and nothing else of Electron or Node.js.
const desktop: KynovaDesktop = {
    platform: process.platform === 'darwin' ? 'mac' : 'windows',
    updates: process.platform === 'win32' ? updates : undefined,
    openMenu: (x, y) => ipcRenderer.send(DESKTOP_CHANNELS.openMenu, x, y),
    windowAction: (action) => ipcRenderer.send(DESKTOP_CHANNELS.windowAction, action),
    onMaximized: (listener) => {
        maximizedListeners.add(listener)
        listener(isMaximized)

        return () => maximizedListeners.delete(listener)
    },
    onFullScreen: (listener) => {
        const handle = (_event: Electron.IpcRendererEvent, isFullScreen: boolean) =>
            listener(isFullScreen)

        ipcRenderer.on(DESKTOP_CHANNELS.fullScreen, handle)

        return () => ipcRenderer.removeListener(DESKTOP_CHANNELS.fullScreen, handle)
    },
}

contextBridge.exposeInMainWorld('kynovaDesktop', desktop)
