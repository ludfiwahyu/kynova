import { Copy, Trash2, X } from 'lucide-react'

import { Button } from '@/components'
import { useSelectionBar } from '@/pages/collections/hooks/useSelectionBar'
import { MENU_ICON_SIZE } from '@/pages/collections/logic/config'

export function SelectionBar() {
    const bar = useSelectionBar()

    if (!bar.isVisible) {
        return null
    }

    return (
        <div
            role="toolbar"
            aria-label="Chosen items"
            className="selection-bar"
        >
            <span className="selection-count">{bar.countLabel}</span>

            <Button
                variant="icon"
                icon={<Copy size={MENU_ICON_SIZE} />}
                title={bar.duplicateTitle}
                aria-label="Duplicate chosen requests"
                disabled={!bar.canEdit || !bar.duplicable}
                onClick={bar.duplicate}
            />

            <Button
                variant="icon"
                icon={<Trash2 size={MENU_ICON_SIZE} />}
                title="Delete"
                aria-label="Delete chosen items"
                disabled={!bar.canEdit}
                onClick={bar.remove}
            />

            <Button
                variant="icon"
                icon={<X size={MENU_ICON_SIZE} />}
                title="Clear selection (Esc)"
                aria-label="Clear selection"
                onClick={bar.clear}
            />
        </div>
    )
}
