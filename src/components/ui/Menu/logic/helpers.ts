import { GAP, ITEM_SELECTOR, MARGIN } from '@/components/ui/Menu/logic/config'
import type { Anchor } from '@/components/ui/Menu/types'

/**
 * Where the menu goes: below the anchor, or above it when there is no room
 * below, and always fully inside the window.
 */
export function placeMenu(anchor: Anchor, width: number, height: number, align: 'start' | 'end') {
    const preferredLeft = align === 'end' ? anchor.right - width : anchor.left
    const left = Math.max(MARGIN, Math.min(preferredLeft, innerWidth - width - MARGIN))

    const below = anchor.bottom + GAP
    const above = anchor.top - GAP - height
    const fitsBelow = below + height <= innerHeight - MARGIN
    let top = Math.max(MARGIN, innerHeight - MARGIN - height)

    if (fitsBelow) {
        top = below
    } else if (above >= MARGIN) {
        top = above
    }

    return {
        left,
        top,
    }
}

export function focusItem(menu: HTMLElement, move: (index: number, count: number) => number): void {
    const items = [...menu.querySelectorAll<HTMLElement>(ITEM_SELECTOR)]

    if (items.length === 0) {
        return
    }

    const current = items.indexOf(document.activeElement as HTMLElement)

    items[(move(current, items.length) + items.length) % items.length].focus()
}

/** Where a popover renders: the opener's modal dialog, or the page. */
export function popoverContainer(opener: Element | null | undefined): Element {
    return opener?.closest('dialog[open]') ?? document.body
}

export function menuItemRole(checked: boolean | undefined, toggle: boolean | undefined): string {
    if (checked === undefined) {
        return 'menuitem'
    }

    return toggle ? 'menuitemcheckbox' : 'menuitemradio'
}
