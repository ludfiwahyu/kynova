export function useDesktopMenu() {
    const desktop = window.kynovaDesktop

    /** Opens File, Edit, View and Window under the button, as one native menu. */
    function open(button: HTMLElement) {
        const rect = button.getBoundingClientRect()

        desktop?.openMenu(rect.left, rect.bottom)
    }

    return {
        isShown: desktop?.platform === 'windows',
        open,
    }
}
