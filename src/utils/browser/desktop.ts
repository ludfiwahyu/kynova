/** In the desktop app, marks the document with the platform and full screen for shell.css. */
export function startDesktopChrome(): void {
    const desktop = window.kynovaDesktop

    if (!desktop) {
        return
    }

    const root = document.documentElement

    root.dataset.desktop = desktop.platform
    desktop.onFullScreen((isFullScreen) => {
        if (isFullScreen) {
            root.dataset.fullScreen = 'true'
        } else {
            delete root.dataset.fullScreen
        }
    })
}
