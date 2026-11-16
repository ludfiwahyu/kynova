import { SlidersHorizontal, SlidersVertical, UserRound, Users } from 'lucide-react'

import { Button, Menu, MenuItem, MenuSeparator } from '@/components'
import { useSettingsMenu } from '@/layouts/Workbench/hooks/useSettingsMenu'
import { MENU_ICON_SIZE, TOP_ICON_SIZE } from '@/layouts/Workbench/logic/config'

export function SettingsMenu() {
    const menu = useSettingsMenu()

    return (
        <Menu
            align="end"
            label="Settings"
            trigger={(props) => (
                <Button
                    variant="topbarIcon"
                    icon={<SlidersVertical size={TOP_ICON_SIZE} />}
                    aria-label="Settings"
                    title="Settings"
                    {...props}
                />
            )}
        >
            <MenuItem
                icon={<SlidersHorizontal size={MENU_ICON_SIZE} />}
                hint="⌘,"
                onSelect={menu.openApp}
            >
                App settings
            </MenuItem>

            <MenuSeparator />

            <MenuItem
                icon={<Users size={MENU_ICON_SIZE} />}
                onSelect={menu.openWorkspace}
            >
                Workspace settings
            </MenuItem>

            <MenuItem
                icon={<UserRound size={MENU_ICON_SIZE} />}
                onSelect={menu.openAccount}
            >
                Account settings
            </MenuItem>
        </Menu>
    )
}
