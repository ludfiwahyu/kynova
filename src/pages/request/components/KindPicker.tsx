import { ChevronsUpDown } from 'lucide-react'

import { Button, Menu, MenuItem } from '@/components'
import { useKindPicker } from '@/pages/request/hooks/useKindPicker'
import { BADGE_CARET_SIZE, HEADER_ICON_SIZE } from '@/pages/request/logic/config'
import type { KindPickerProps } from '@/pages/request/types'

export function KindPicker(props: KindPickerProps) {
    const { item } = props
    const picker = useKindPicker(props)

    return (
        <span className="contents">
            {picker.canEdit ? (
                <Menu
                    label="Request type"
                    trigger={(triggerProps) => (
                        <Button
                            variant="plain"
                            className="kind-badge kind-picker"
                            aria-label={picker.triggerLabel}
                            title="Request type"
                            iconEnd={<ChevronsUpDown size={BADGE_CARET_SIZE} />}
                            {...triggerProps}
                        >
                            {picker.badge}
                        </Button>
                    )}
                >
                    {picker.types.map(({ kind, label, icon: Icon }) => (
                        <MenuItem
                            key={kind}
                            checked={kind === item.kind}
                            icon={<Icon size={HEADER_ICON_SIZE} />}
                            onSelect={() => picker.switchTo(kind)}
                        >
                            {label}
                        </MenuItem>
                    ))}
                </Menu>
            ) : (
                <span className="kind-badge">{picker.badge}</span>
            )}
        </span>
    )
}
