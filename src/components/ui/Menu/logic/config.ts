/** The space between an anchor and its menu, and the menu's minimum distance from the window edge. */
export const GAP = 4
export const MARGIN = 8
export const MAX_HEIGHT = 420

export const ITEM_SELECTOR =
    '[role^="menuitem"]:not([aria-disabled="true"]), [role="option"]:not([aria-disabled="true"])'

export const TRIGGER_SELECTOR = 'button, [tabindex]'

export const FADE_IN = {
    y: -3,
    duration: 0.14,
}

export const FADE_OUT = { y: -2 }

export const MOVES: Record<string, (index: number, count: number) => number> = {
    ArrowDown: (index) => index + 1,
    ArrowUp: (index) => index - 1,
    Home: () => 0,
    End: (_, count) => count - 1,
}
