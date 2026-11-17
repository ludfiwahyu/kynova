import type { DesktopMenu } from '#shared/desktop.ts'

export function useDesktopMenu() {
    const desktop = window.kynovaDesktop

    /** Opens the app's own menu under its label, as a native title bar menu would. */
    function open(menu: DesktopMenu, label: HTMLElement) {
        const rect = label.getBoundingClientRect()

        desktop?.openMenu(menu, rect.left, rect.bottom)
    }

    return {
        isShown: desktop?.platform === 'windows',
        open,
    }
}
