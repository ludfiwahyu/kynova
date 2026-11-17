import { contextBridge, ipcRenderer } from 'electron'

import { DESKTOP_CHANNELS, type KynovaDesktop } from '#shared/desktop.ts'

// The page gets these few calls and nothing else of Electron or Node.js.
const desktop: KynovaDesktop = {
    platform: process.platform === 'darwin' ? 'mac' : 'windows',
    openMenu: (menu, x, y) => ipcRenderer.send(DESKTOP_CHANNELS.openMenu, menu, x, y),
    setTitleBarColors: (color, symbolColor) =>
        ipcRenderer.send(DESKTOP_CHANNELS.titleBarColors, color, symbolColor),
    onFullScreen: (listener) => {
        const handle = (_event: Electron.IpcRendererEvent, isFullScreen: boolean) =>
            listener(isFullScreen)

        ipcRenderer.on(DESKTOP_CHANNELS.fullScreen, handle)

        return () => ipcRenderer.removeListener(DESKTOP_CHANNELS.fullScreen, handle)
    },
}

contextBridge.exposeInMainWorld('kynovaDesktop', desktop)
