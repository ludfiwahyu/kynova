import { Delete, FilePlus2, Files, FolderPlus, Radio, Share, TextCursorInput } from 'lucide-react'

import { MenuItem, MenuSeparator } from '@/components'
import { useItemMenuItems } from '@/pages/collections/hooks/useItemMenuItems'
import { MENU_ICON_SIZE } from '@/pages/collections/logic/config'
import type { ItemMenuItemsProps } from '@/pages/collections/types'

export function ItemMenuItems({ item, canEdit, onRename }: ItemMenuItemsProps) {
    const menu = useItemMenuItems(item)

    return (
        <>
            {menu.isContainer && canEdit && (
                <>
                    <MenuItem
                        icon={<FilePlus2 size={MENU_ICON_SIZE} />}
                        onSelect={menu.addRequest}
                    >
                        Add request
                    </MenuItem>

                    <MenuItem
                        icon={<Radio size={MENU_ICON_SIZE} />}
                        onSelect={menu.addSocket}
                    >
                        Add WebSocket request
                    </MenuItem>

                    <MenuItem
                        icon={<FolderPlus size={MENU_ICON_SIZE} />}
                        onSelect={menu.addFolder}
                    >
                        Add folder
                    </MenuItem>

                    <MenuSeparator />
                </>
            )}

            {menu.isCollection && (
                <MenuItem
                    icon={<Share size={MENU_ICON_SIZE} />}
                    onSelect={menu.exportFile}
                >
                    Export as v2.1
                </MenuItem>
            )}

            {canEdit && (
                <>
                    <MenuItem
                        icon={<TextCursorInput size={MENU_ICON_SIZE} />}
                        hint="F2"
                        onSelect={onRename}
                    >
                        Rename
                    </MenuItem>

                    {menu.isRequest && (
                        <MenuItem
                            icon={<Files size={MENU_ICON_SIZE} />}
                            onSelect={menu.duplicate}
                        >
                            Duplicate
                        </MenuItem>
                    )}

                    <MenuSeparator />

                    <MenuItem
                        icon={<Delete size={MENU_ICON_SIZE} />}
                        danger
                        hint="Del"
                        onSelect={menu.remove}
                    >
                        Delete
                    </MenuItem>
                </>
            )}
        </>
    )
}
