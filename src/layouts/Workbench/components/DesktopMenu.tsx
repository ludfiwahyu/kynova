import { Menu as MenuIcon } from 'lucide-react'

import { Button } from '@/components'
import { useDesktopMenu } from '@/layouts/Workbench/hooks/useDesktopMenu'
import { TOP_ICON_SIZE } from '@/layouts/Workbench/logic/config'

/** File, Edit, View and Window behind one button in the desktop app on Windows and Linux, which has no title bar of its own. */
export function DesktopMenu() {
    const menu = useDesktopMenu()

    if (!menu.isShown) {
        return null
    }

    return (
        <Button
            variant="topbarIcon"
            icon={<MenuIcon size={TOP_ICON_SIZE} />}
            aria-label="Application menu"
            aria-haspopup="menu"
            title="File, Edit, View, Window"
            onClick={(event) => menu.open(event.currentTarget)}
        />
    )
}
