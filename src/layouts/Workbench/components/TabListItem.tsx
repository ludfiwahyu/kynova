import { MenuItem } from '@/components'
import { TabGlyph } from '@/layouts/Workbench/components/TabGlyph'
import { useTabLabel } from '@/layouts/Workbench/hooks/useTabLabel'
import type { TabListItemProps } from '@/layouts/Workbench/types'
import { openTab } from '@/stores'

export function TabListItem({ tab }: TabListItemProps) {
    const label = useTabLabel(tab)

    if (!label) {
        return null
    }

    return (
        <MenuItem
            icon={<TabGlyph label={label} />}
            onSelect={() => openTab(tab)}
        >
            {label.name}
        </MenuItem>
    )
}
