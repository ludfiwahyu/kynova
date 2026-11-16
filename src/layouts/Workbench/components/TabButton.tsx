import { X } from 'lucide-react'

import { Button, MenuItem, useContextMenu } from '@/components'
import { TabGlyph } from '@/layouts/Workbench/components/TabGlyph'
import { useTabButton } from '@/layouts/Workbench/hooks/useTabButton'
import { TAB_ICON_SIZE } from '@/layouts/Workbench/logic/config'
import type { TabButtonProps } from '@/layouts/Workbench/types'
import { closeAllTabs, closeOtherTabs } from '@/stores'

export function TabButton(props: TabButtonProps) {
    const { tab, onPointerDown, onClose } = props
    const button = useTabButton(props)

    const contextMenu = useContextMenu(() => (
        <>
            <MenuItem onSelect={onClose}>Close tab</MenuItem>
            <MenuItem onSelect={() => closeOtherTabs(tab)}>Close other tabs</MenuItem>
            <MenuItem onSelect={closeAllTabs}>Close all tabs</MenuItem>
        </>
    ))

    // Deleted; the workbench closes the tab.
    if (!button.label) {
        return null
    }

    return (
        <div
            ref={button.attach}
            className="doc-tab"
            data-active={button.isActive}
            data-preview={button.isPreview}
            data-dirty={button.isDirty}
            onAuxClick={button.handleAuxClick}
            onContextMenu={contextMenu.onContextMenu}
            onPointerDown={onPointerDown}
        >
            <Button
                variant="plain"
                className="doc-tab-main"
                role="tab"
                aria-selected={button.isActive}
                title={button.title}
                onClick={button.open}
                onDoubleClick={button.keep}
                onKeyDown={button.handleKeyDown}
            >
                {button.showIcon && <TabGlyph label={button.label} />}
                <span
                    className="steady-bold truncate"
                    data-text={button.label.name}
                >
                    {button.label.name}
                </span>
            </Button>

            <Button
                variant="plain"
                className="doc-tab-close"
                aria-label={
                    button.isDirty ? `${button.closeLabel} (unsaved changes)` : button.closeLabel
                }
                icon={
                    <X
                        size={TAB_ICON_SIZE}
                        strokeWidth={2}
                    />
                }
                onClick={onClose}
            />

            {contextMenu.menu}
        </div>
    )
}
