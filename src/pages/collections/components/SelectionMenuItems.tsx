import { Copy, Trash2, X } from 'lucide-react'

import { MenuItem, MenuSeparator } from '@/components'
import { useSelectionMenu } from '@/pages/collections/hooks/useSelectionMenu'
import { MENU_ICON_SIZE } from '@/pages/collections/logic/config'

export function SelectionMenuItems() {
    const menu = useSelectionMenu()

    return (
        <>
            <MenuItem
                icon={<Copy size={MENU_ICON_SIZE} />}
                disabled={!menu.canEdit || !menu.canDuplicate}
                onSelect={menu.duplicate}
            >
                {menu.duplicateLabel}
            </MenuItem>

            <MenuItem
                icon={<Trash2 size={MENU_ICON_SIZE} />}
                danger
                disabled={!menu.canEdit}
                onSelect={menu.remove}
            >
                {menu.deleteLabel}
            </MenuItem>

            <MenuSeparator />

            <MenuItem
                icon={<X size={MENU_ICON_SIZE} />}
                onSelect={menu.clear}
            >
                Clear selection
            </MenuItem>
        </>
    )
}
