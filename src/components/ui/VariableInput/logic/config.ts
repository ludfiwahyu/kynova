/** `{{name}}` placeholders and `:name` path segments, the parts the input colours. */
export const TOKEN = /(\{\{\s*[^{}]+?\s*\}\})|((?<=\/):[A-Za-z_][\w-]*)/g

/** The most suggestions shown at once; typing narrows them. */
export const MAX_SUGGESTIONS = 50

/** How long the pointer rests on a variable before its details show. */
export const HOVER_DELAY_MS = 350

/** How far floating parts stay from the window edge, and how far under the field they sit. */
export const EDGE_MARGIN = 8
export const FLOAT_GAP = 4
export const FLOAT_WIDTH = 300

export const LIST_MOVES: Record<string, number> = {
    ArrowDown: 1,
    ArrowUp: -1,
}

/** Keeps the mirror as wide as the input's scroll area at the end of the text. */
export const MIRROR_END = '​'

export const EMPTY_TEXT = 'empty'

export const LIST_CLASS = 'menu max-h-72 w-[min(420px,calc(100vw-16px))]'
export const LIST_MAX_WIDTH = 'min(420px, calc(100vw - 16px))'
export const ROW_CLASS = 'flex h-8 cursor-pointer items-center gap-2 rounded-sm px-2'
export const ROW_ACTIVE = 'bg-selected'
export const ROW_IDLE = 'hover:bg-hover'

export const FADE_IN = {
    y: -3,
    duration: 0.14,
}

export const SCOPE_NAME = {
    environment: 'Environment',
    collection: 'Collection',
    dynamic: 'Dynamic',
}

export const BADGE_BASE =
    'inline-grid size-4 flex-none place-items-center rounded-sm font-mono text-[10px] font-bold'

export const SCOPE_BADGE: Record<
    string,
    {
        letter: string
        className: string
    }
> = {
    environment: {
        letter: 'E',
        className: 'bg-ok/15 text-ok',
    },
    collection: {
        letter: 'C',
        className: 'bg-accent/15 text-accent',
    },
    dynamic: {
        letter: '$',
        className: 'bg-patch/15 text-patch',
    },
}

export const FALLBACK_BADGE = {
    letter: 'V',
    className: 'bg-hover text-ink-2',
}
