import {
    Check,
    ChevronsUpDown,
    LayoutDashboard,
    LogOut,
    Pencil,
    Plus,
    Settings,
    Trash2,
} from 'lucide-react'

import { Button, Menu, MenuItem, MenuLabel, MenuSeparator, NameDialog } from '@/components'
import { useWorkspaceMenu } from '@/layouts/Workbench/hooks/useWorkspaceMenu'
import { MENU_ICON_SIZE } from '@/layouts/Workbench/logic/config'

export function WorkspaceMenu() {
    const menu = useWorkspaceMenu()

    if (!menu.active) {
        return null
    }

    return (
        <span className="contents">
            <Menu
                trigger={(props) => (
                    <Button
                        variant="plain"
                        className="topbar-button workspace-switch"
                        iconEnd={<ChevronsUpDown size={MENU_ICON_SIZE} />}
                        {...props}
                    >
                        <span className="truncate">{menu.active!.name}</span>
                    </Button>
                )}
            >
                <MenuLabel>Workspaces</MenuLabel>

                {menu.lines.map((line) => (
                    <MenuItem
                        key={line.id}
                        checked={line.isActive}
                        icon={
                            <Check
                                size={MENU_ICON_SIZE}
                                style={line.iconStyle}
                            />
                        }
                        onSelect={() => menu.select(line.id)}
                    >
                        {line.name}
                    </MenuItem>
                ))}

                <MenuSeparator />

                <MenuItem
                    icon={<LayoutDashboard size={MENU_ICON_SIZE} />}
                    onSelect={menu.openOverview}
                >
                    Workspace overview
                </MenuItem>

                <MenuItem
                    icon={<Settings size={MENU_ICON_SIZE} />}
                    onSelect={menu.openSettings}
                >
                    Workspace settings
                </MenuItem>

                <MenuSeparator />

                <MenuItem
                    icon={<Plus size={MENU_ICON_SIZE} />}
                    onSelect={menu.openCreate}
                >
                    New workspace
                </MenuItem>

                {menu.isOwner && (
                    <>
                        <MenuItem
                            icon={<Pencil size={MENU_ICON_SIZE} />}
                            onSelect={menu.openRename}
                        >
                            Rename {menu.active.name}
                        </MenuItem>

                        <MenuItem
                            icon={<Trash2 size={MENU_ICON_SIZE} />}
                            danger
                            onSelect={menu.remove}
                        >
                            Delete {menu.active.name}
                        </MenuItem>
                    </>
                )}

                {!menu.isOwner && (
                    <MenuItem
                        icon={<LogOut size={MENU_ICON_SIZE} />}
                        danger
                        onSelect={menu.leave}
                    >
                        Leave {menu.active.name}
                    </MenuItem>
                )}
            </Menu>

            {menu.dialog === 'create' && (
                <NameDialog
                    title="New workspace"
                    label="Workspace name"
                    action="Create workspace"
                    onSubmit={menu.create}
                    onClose={menu.closeDialog}
                />
            )}

            {menu.dialog === 'rename' && (
                <NameDialog
                    title="Rename workspace"
                    label="Workspace name"
                    initialName={menu.active.name}
                    action="Rename"
                    onSubmit={menu.rename}
                    onClose={menu.closeDialog}
                />
            )}
        </span>
    )
}
