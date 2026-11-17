import { Ellipsis, MailPlus, SlidersHorizontal, UserRound, Users } from 'lucide-react'

import { Button, Menu, MenuItem, MenuSeparator } from '@/components'
import { useSettingsMenu } from '@/layouts/Workbench/hooks/useSettingsMenu'
import { MENU_ICON_SIZE, TOP_ICON_SIZE } from '@/layouts/Workbench/logic/config'
import type { TopBarMoreMenuProps } from '@/layouts/Workbench/types'

/** Invite and Settings in one menu, for a top bar too narrow to show them. */
export function TopBarMoreMenu({ onInvite }: TopBarMoreMenuProps) {
    const settings = useSettingsMenu()

    return (
        <span className="topbar-more">
            <Menu
                align="end"
                label="More"
                trigger={(props) => (
                    <Button
                        variant="topbarIcon"
                        icon={<Ellipsis size={TOP_ICON_SIZE} />}
                        aria-label="More"
                        title="More"
                        {...props}
                    />
                )}
            >
                <MenuItem
                    icon={<MailPlus size={MENU_ICON_SIZE} />}
                    onSelect={onInvite}
                >
                    Invite people
                </MenuItem>

                <MenuSeparator />

                <MenuItem
                    icon={<SlidersHorizontal size={MENU_ICON_SIZE} />}
                    onSelect={settings.openApp}
                >
                    App settings
                </MenuItem>

                <MenuItem
                    icon={<Users size={MENU_ICON_SIZE} />}
                    onSelect={settings.openWorkspace}
                >
                    Workspace settings
                </MenuItem>

                <MenuItem
                    icon={<UserRound size={MENU_ICON_SIZE} />}
                    onSelect={settings.openAccount}
                >
                    Account settings
                </MenuItem>
            </Menu>
        </span>
    )
}
