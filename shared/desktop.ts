/** The menus of the desktop app on Windows and Linux, in order. The top bar opens them from one button. */
export const DESKTOP_MENUS = ['File', 'Edit', 'View', 'Window'] as const

export type DesktopMenu = (typeof DESKTOP_MENUS)[number]

/** What the desktop window and its page say to each other. */
export const DESKTOP_CHANNELS = {
    openMenu: 'desktop:open-menu',
    windowAction: 'desktop:window-action',
    maximized: 'desktop:maximized',
    fullScreen: 'desktop:full-screen',
    updateState: 'desktop:update-state',
    updateWatch: 'desktop:update-watch',
    updateAction: 'desktop:update-action',
} as const

/** The height of the top bar, which the window's own buttons line up with. Kept in step with shell.css. */
export const TITLE_BAR_HEIGHT = 44

export type WindowAction = 'minimize' | 'toggleMaximize' | 'close'

export type UpdateAction = 'check' | 'download' | 'install'

/** Where the app is with updating itself. `unsupported` when it is not the installed app. */
export type UpdateState =
    | { status: 'unsupported' }
    | { status: 'idle' }
    | { status: 'checking' }
    | { status: 'latest' }
    | {
          status: 'available'
          version: string
      }
    | {
          status: 'downloading'
          percent: number
      }
    | {
          status: 'ready'
          version: string
      }
    | {
          status: 'error'
          message: string
      }

/** Updating from the project's releases. Windows only. */
export interface DesktopUpdates {
    run: (action: UpdateAction) => void
    /** Called with each new state, starting with the current one; returns a function that stops it. */
    onState: (listener: (state: UpdateState) => void) => () => void
}

/** What the desktop app's preload gives the page as `window.kynovaDesktop`. Absent in a browser. */
export interface KynovaDesktop {
    platform: 'mac' | 'windows'
    /** Absent where the app cannot update itself. */
    updates?: DesktopUpdates
    /** Opens the app's menus (File, Edit, View, Window) under the point, in page pixels. */
    openMenu: (x: number, y: number) => void
    /** The window buttons the page draws on Windows and Linux. */
    windowAction: (action: WindowAction) => void
    /** Called now and whenever the window is maximized or restored; returns a function that stops it. */
    onMaximized: (listener: (isMaximized: boolean) => void) => () => void
    /** Called when the window enters or leaves full screen; returns a function that stops it. */
    onFullScreen: (listener: (isFullScreen: boolean) => void) => () => void
}
