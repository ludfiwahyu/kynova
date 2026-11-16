import { Delete, Files, Power, Share, TextCursorInput } from 'lucide-react'

import { MenuItem, MenuSeparator } from '@/components'
import { ROW_ICON_SIZE } from '@/pages/environments/logic/config'
import type { EnvironmentMenuItemsProps } from '@/pages/environments/types'

export function EnvironmentMenuItems({ row }: EnvironmentMenuItemsProps) {
    return (
        <>
            <MenuItem
                icon={<Power size={ROW_ICON_SIZE} />}
                onSelect={row.toggleActive}
            >
                {row.toggleLabel}
            </MenuItem>

            {row.canEdit && (
                <>
                    <MenuSeparator />

                    <MenuItem
                        icon={<TextCursorInput size={ROW_ICON_SIZE} />}
                        onSelect={row.rename}
                    >
                        Rename
                    </MenuItem>

                    <MenuItem
                        icon={<Files size={ROW_ICON_SIZE} />}
                        onSelect={row.duplicate}
                    >
                        Duplicate
                    </MenuItem>
                </>
            )}

            <MenuItem
                icon={<Share size={ROW_ICON_SIZE} />}
                onSelect={row.exportFile}
            >
                Export
            </MenuItem>

            {row.canEdit && (
                <>
                    <MenuSeparator />

                    <MenuItem
                        icon={<Delete size={ROW_ICON_SIZE} />}
                        danger
                        onSelect={row.remove}
                    >
                        Delete
                    </MenuItem>
                </>
            )}
        </>
    )
}
