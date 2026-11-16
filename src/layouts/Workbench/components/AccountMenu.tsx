import { LogOut } from 'lucide-react'

import { Avatar, Button, Menu, MenuItem, MenuLabel, MenuSeparator } from '@/components'
import { useAccountMenu } from '@/layouts/Workbench/hooks/useAccountMenu'
import { MENU_ICON_SIZE } from '@/layouts/Workbench/logic/config'

export function AccountMenu() {
    const account = useAccountMenu()

    if (!account.user) {
        return null
    }

    return (
        <Menu
            align="end"
            label="Account"
            trigger={(props) => (
                <Button
                    variant="plain"
                    className="avatar-button"
                    aria-label="Account"
                    {...props}
                >
                    <Avatar
                        name={account.user!.name}
                        color={account.user!.color}
                    />
                </Button>
            )}
        >
            <MenuLabel>
                {account.user.name} · {account.user.email}
            </MenuLabel>

            <MenuSeparator />

            <MenuItem
                icon={<LogOut size={MENU_ICON_SIZE} />}
                onSelect={account.leave}
            >
                Sign out
            </MenuItem>
        </Menu>
    )
}
