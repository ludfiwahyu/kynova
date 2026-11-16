import { Delete, RotateCcw } from 'lucide-react'

import { Button, ItemGlyph } from '@/components'
import { useArchiveRow } from '@/pages/collections/hooks/useArchiveRow'
import { ACTIONS_ICON_SIZE } from '@/pages/collections/logic/config'
import type { ArchiveRowProps } from '@/pages/collections/types'

/** A deleted item: what it was, who deleted it and when, and the ways back or out. */
export function ArchiveRow(props: ArchiveRowProps) {
    const { entry } = props
    const row = useArchiveRow(props)

    return (
        <div
            className="tree-row archive-row"
            role="listitem"
            title={row.title}
        >
            <ItemGlyph item={row.root} />

            <span className="archive-text">
                <span className="tree-name truncate">{entry.name}</span>
                <span className="archive-meta truncate">{row.meta}</span>
            </span>

            {row.canEdit && (
                <span className="tree-actions">
                    <Button
                        variant="icon"
                        icon={<RotateCcw size={ACTIONS_ICON_SIZE} />}
                        title="Restore"
                        aria-label={`Restore ${entry.name}`}
                        onClick={row.restore}
                    />

                    <Button
                        variant="icon"
                        icon={<Delete size={ACTIONS_ICON_SIZE} />}
                        title="Delete for good"
                        aria-label={`Delete ${entry.name} for good`}
                        onClick={row.removeForGood}
                    />
                </span>
            )}
        </div>
    )
}
