import { Users } from 'lucide-react'

import { EnvironmentGlyph, ItemGlyph } from '@/components'
import { TAB_ICON_SIZE } from '@/layouts/Workbench/logic/config'
import type { TabGlyphProps } from '@/layouts/Workbench/types'

export function TabGlyph({ label }: TabGlyphProps) {
    return (
        <span className="contents">
            {label.item && <ItemGlyph item={label.item} />}

            {label.environment && <EnvironmentGlyph color={label.environment.color} />}

            {label.kind === 'workspace' && (
                <Users
                    size={TAB_ICON_SIZE}
                    className="item-icon"
                />
            )}
        </span>
    )
}
