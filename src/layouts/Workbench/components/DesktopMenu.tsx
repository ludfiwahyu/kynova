import { Button } from '@/components'
import { useDesktopMenu } from '@/layouts/Workbench/hooks/useDesktopMenu'
import { DESKTOP_MENUS } from '#shared/desktop.ts'

/** File, Edit, View and Window in the top bar of the desktop app on Windows and Linux, which has no title bar of its own. */
export function DesktopMenu() {
    const menu = useDesktopMenu()

    if (!menu.isShown) {
        return null
    }

    return (
        <nav
            className="desktop-menu"
            aria-label="Application menu"
        >
            {DESKTOP_MENUS.map((label) => (
                <Button
                    key={label}
                    variant="plain"
                    className="desktop-menu-item"
                    aria-haspopup="menu"
                    onClick={(event) => menu.open(label, event.currentTarget)}
                >
                    {label}
                </Button>
            ))}
        </nav>
    )
}
