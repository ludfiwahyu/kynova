import { createPortal } from 'react-dom'

import { usePopover } from '@/components/ui/Menu/hooks/usePopover'
import { popoverContainer } from '@/components/ui/Menu/logic/helpers'
import type { PopoverProps } from '@/components/ui/Menu/types'

/**
 * A menu or list floating at `anchor`. Closes on outside click, Escape, Tab,
 * scroll, resize, or choosing an item. Shared by menus and Select.
 */
export function Popover({
    anchor,
    align,
    onClose,
    label,
    role = 'menu',
    minWidth,
    opener,
    children,
}: PopoverProps) {
    const popover = usePopover({
        anchor,
        align,
        onClose,
        minWidth,
        opener,
    })

    return createPortal(
        <div
            ref={popover.ref}
            className="menu"
            role={role}
            aria-label={label}
            style={{ visibility: 'hidden' }}
            onKeyDown={popover.onKeyDown}
            onClick={popover.onClick}
            onContextMenu={(event) => event.preventDefault()}
        >
            {children}
        </div>,
        popoverContainer(opener),
    )
}
