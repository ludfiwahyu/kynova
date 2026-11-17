import { contextBridge, ipcRenderer, webFrame } from 'electron'

import { DESKTOP_CHANNELS, type KynovaDesktop } from '#shared/desktop.ts'

// The page gets these few calls and nothing else of Electron or Node.js.
const desktop: KynovaDesktop = {
    platform: process.platform === 'darwin' ? 'mac' : 'windows',
    openMenu: (x, y) => ipcRenderer.send(DESKTOP_CHANNELS.openMenu, x, y),
    setTitleBarColors: (color, symbolColor) =>
        ipcRenderer.send(DESKTOP_CHANNELS.titleBarColors, color, symbolColor),
    getZoomFactor: () => webFrame.getZoomFactor(),
    setTitleBarHeight: (height) => ipcRenderer.send(DESKTOP_CHANNELS.titleBarHeight, height),
    onFullScreen: (listener) => {
        const handle = (_event: Electron.IpcRendererEvent, isFullScreen: boolean) =>
            listener(isFullScreen)

        ipcRenderer.on(DESKTOP_CHANNELS.fullScreen, handle)

        return () => ipcRenderer.removeListener(DESKTOP_CHANNELS.fullScreen, handle)
    },
}

contextBridge.exposeInMainWorld('kynovaDesktop', desktop)
