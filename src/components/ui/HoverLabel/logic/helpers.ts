import { EDGE_MARGIN, GAP } from '@/components/ui/HoverLabel/logic/config'

/** Under the anchor, or above it when there is no room, and always inside the window. */
export function placeLabel(anchor: HTMLElement, width: number, height: number) {
    const rect = anchor.getBoundingClientRect()
    const below = rect.bottom + GAP
    const fitsBelow = below + height <= innerHeight - EDGE_MARGIN

    return {
        left: Math.max(EDGE_MARGIN, Math.min(rect.left, innerWidth - width - EDGE_MARGIN)),
        top: fitsBelow ? below : Math.max(EDGE_MARGIN, rect.top - GAP - height),
    }
}

/** Where floating parts render: the anchor's modal dialog, or the page. */
export function labelContainer(anchor: HTMLElement): Element {
    return anchor.closest('dialog[open]') ?? document.body
}
