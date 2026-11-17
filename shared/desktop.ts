/** The menus of the desktop app on Windows and Linux, in order. The top bar opens them from one button. */
export const DESKTOP_MENUS = ['File', 'Edit', 'View', 'Window'] as const

export type DesktopMenu = (typeof DESKTOP_MENUS)[number]

/** What the desktop window and its page say to each other. */
export const DESKTOP_CHANNELS = {
    openMenu: 'desktop:open-menu',
    titleBarColors: 'desktop:title-bar-colors',
    titleBarHeight: 'desktop:title-bar-height',
    fullScreen: 'desktop:full-screen',
} as const

/** The height of the top bar, which the window's own buttons line up with. Kept in step with shell.css. */
export const TITLE_BAR_HEIGHT = 44

/** The width of the three window buttons the system draws over the top bar's right end on Windows and Linux, in window pixels. They do not zoom with the page. */
export const WINDOW_BUTTONS_WIDTH = 138

/** What the desktop app's preload gives the page as `window.kynovaDesktop`. Absent in a browser. */
export interface KynovaDesktop {
    platform: 'mac' | 'windows'
    /** Opens the app's menus (File, Edit, View, Window) under the point, in page pixels. */
    openMenu: (x: number, y: number) => void
    /** Colours the window buttons drawn over the top bar on Windows and Linux, as `#rrggbb`. */
    setTitleBarColors: (color: string, symbolColor: string) => void
    /** The page's zoom factor: 1 at 100%. */
    getZoomFactor: () => number
    /** Sizes the window buttons to the top bar's height in window pixels, which the page zoom changes. */
    setTitleBarHeight: (height: number) => void
    /** Called when the window enters or leaves full screen; returns a function that stops it. */
    onFullScreen: (listener: (isFullScreen: boolean) => void) => () => void
}
