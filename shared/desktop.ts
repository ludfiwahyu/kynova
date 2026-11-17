/** The menus of the desktop app on Windows and Linux, in order. The page shows them in its top bar. */
export const DESKTOP_MENUS = ['File', 'Edit', 'View', 'Window'] as const

export type DesktopMenu = (typeof DESKTOP_MENUS)[number]

/** What the desktop window and its page say to each other. */
export const DESKTOP_CHANNELS = {
    openMenu: 'desktop:open-menu',
    titleBarColors: 'desktop:title-bar-colors',
    fullScreen: 'desktop:full-screen',
} as const

/** The height of the top bar, which the window's own buttons line up with. Kept in step with shell.css. */
export const TITLE_BAR_HEIGHT = 44

/** What the desktop app's preload gives the page as `window.kynovaDesktop`. Absent in a browser. */
export interface KynovaDesktop {
    platform: 'mac' | 'windows'
    /** Opens one of the app's menus under the point, in page pixels. */
    openMenu: (menu: DesktopMenu, x: number, y: number) => void
    /** Colours the window buttons drawn over the top bar on Windows and Linux, as `#rrggbb`. */
    setTitleBarColors: (color: string, symbolColor: string) => void
    /** Called when the window enters or leaves full screen; returns a function that stops it. */
    onFullScreen: (listener: (isFullScreen: boolean) => void) => () => void
}
