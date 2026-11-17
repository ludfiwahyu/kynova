import { TITLE_BAR_HEIGHT, WINDOW_BUTTONS_WIDTH } from '#shared/desktop.ts'

let canvas: CanvasRenderingContext2D | null = null

/** Any CSS colour as `#rrggbb`, which the desktop window accepts. */
function toHex(color: string): string {
    canvas ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true })

    if (!canvas) {
        return '#000000'
    }

    canvas.clearRect(0, 0, 1, 1)
    canvas.fillStyle = color
    canvas.fillRect(0, 0, 1, 1)

    const [red, green, blue] = canvas.getImageData(0, 0, 1, 1).data

    return `#${[red, green, blue].map((part) => part.toString(16).padStart(2, '0')).join('')}`
}

function token(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/**
 * In the desktop app the page is also the window's title bar. This marks the document with
 * the platform (`data-desktop`) and full screen (`data-full-screen`) for shell.css, and on
 * Windows and Linux keeps the window buttons in the top bar's colours as the theme changes.
 */
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

    if (desktop.platform !== 'windows') {
        return
    }

    const sync = () => desktop.setTitleBarColors(toHex(token('--rail')), toHex(token('--rail-ink')))

    sync()
    new MutationObserver(sync).observe(root, {
        attributes: true,
        attributeFilter: ['data-theme', 'style'],
    })

    // The window buttons keep their size when the page zooms, so the top bar makes room for them,
    // and they take the bar's height, in zoomed pixels.
    let lastZoom = 0

    const fit = () => {
        const zoom = desktop.getZoomFactor()

        if (zoom === lastZoom) {
            return
        }

        lastZoom = zoom
        root.style.setProperty('--window-buttons', `${WINDOW_BUTTONS_WIDTH / zoom}px`)
        desktop.setTitleBarHeight(Math.round(TITLE_BAR_HEIGHT * zoom))
    }

    fit()
    window.addEventListener('resize', fit)
}
