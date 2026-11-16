// ===================================================================
//
//   Types
//
// ===================================================================

export type Platform = 'mac' | 'windows'

export interface Shortcut {
    group: 'Request' | 'Sidebar' | 'Interface' | 'Code editor'
    action: string
    keys: string

    /** Keys on Windows, when they are not the Mac keys with Ctrl for ⌘. */
    windows?: string
}

// ===================================================================
//
//   Shortcut list
//
// ===================================================================

export const SHORTCUTS = {
    // Request

    'request.send': {
        group: 'Request',
        action: 'Send request',
        keys: 'Mod+Enter',
    },

    'request.sendFromUrl': {
        group: 'Request',
        action: 'Send request from the URL field',
        keys: 'Enter',
    },

    'request.save': {
        group: 'Request',
        action: 'Save the open tab',
        keys: 'Mod+S',
    },

    'request.saveAs': {
        group: 'Request',
        action: 'Save request as',
        keys: 'Mod+Shift+S',
    },

    'request.postComment': {
        group: 'Request',
        action: 'Post a comment',
        keys: 'Mod+Enter',
    },

    'request.sendMessage': {
        group: 'Request',
        action: 'Send a WebSocket message',
        keys: 'Mod+Enter',
    },

    // Sidebar

    'sidebar.next': {
        group: 'Sidebar',
        action: 'Next item',
        keys: 'ArrowDown',
    },

    'sidebar.previous': {
        group: 'Sidebar',
        action: 'Previous item',
        keys: 'ArrowUp',
    },

    'sidebar.expand': {
        group: 'Sidebar',
        action: 'Expand item',
        keys: 'ArrowRight',
    },

    'sidebar.collapse': {
        group: 'Sidebar',
        action: 'Collapse item',
        keys: 'ArrowLeft',
    },

    'sidebar.open': {
        group: 'Sidebar',
        action: 'Open item',
        keys: 'Enter',
    },

    'sidebar.preview': {
        group: 'Sidebar',
        action: 'Preview item',
        keys: 'Space',
    },

    'sidebar.rename': {
        group: 'Sidebar',
        action: 'Rename item',
        keys: 'F2',
    },

    'sidebar.delete': {
        group: 'Sidebar',
        action: 'Delete item',
        keys: 'Delete',
    },

    'sidebar.choose': {
        group: 'Sidebar',
        action: 'Choose one more item',
        keys: 'Mod+Click',
    },

    'sidebar.chooseRange': {
        group: 'Sidebar',
        action: 'Choose every item up to this one',
        keys: 'Shift+Click',
    },

    'sidebar.chooseNext': {
        group: 'Sidebar',
        action: 'Choose the next or previous item too',
        keys: 'Shift+Up/Down',
    },

    'sidebar.clearChoice': {
        group: 'Sidebar',
        action: 'Clear the chosen items',
        keys: 'Escape',
    },

    // Interface

    'interface.search': {
        group: 'Interface',
        action: 'Search',
        keys: 'Mod+K',
    },

    'interface.settings': {
        group: 'Interface',
        action: 'Settings',
        keys: 'Mod+,',
    },

    'interface.toggleSidebar': {
        group: 'Interface',
        action: 'Toggle left sidebar',
        keys: 'Mod+\\',
    },

    'interface.toggleRightPanel': {
        group: 'Interface',
        action: 'Toggle right sidebar',
        keys: 'Mod+Alt+\\',
    },

    'interface.close': {
        group: 'Interface',
        action: 'Close a menu, list or dialog',
        keys: 'Escape',
    },

    // Code editor

    'editor.indent': {
        group: 'Code editor',
        action: 'Indent',
        keys: 'Tab',
    },

    'editor.outdent': {
        group: 'Code editor',
        action: 'Outdent',
        keys: 'Shift+Tab',
    },

    'editor.addNextMatch': {
        group: 'Code editor',
        action: 'Add selection to next find match',
        keys: 'Mod+D',
    },

    'editor.selectAllMatches': {
        group: 'Code editor',
        action: 'Select all matches',
        keys: 'Mod+Shift+L',
    },

    'editor.addCursor': {
        group: 'Code editor',
        action: 'Add a cursor',
        keys: 'Alt+Click',
    },

    'editor.oneCursor': {
        group: 'Code editor',
        action: 'Back to one cursor',
        keys: 'Escape',
    },

    'editor.find': {
        group: 'Code editor',
        action: 'Find',
        keys: 'Mod+F',
    },

    'editor.replace': {
        group: 'Code editor',
        action: 'Replace',
        keys: 'Mod+Alt+F',
        windows: 'Mod+H',
    },

    'editor.moveLine': {
        group: 'Code editor',
        action: 'Move line up or down',
        keys: 'Alt+Up/Down',
    },

    'editor.copyLine': {
        group: 'Code editor',
        action: 'Copy line up or down',
        keys: 'Shift+Alt+Up/Down',
    },

    'editor.deleteLine': {
        group: 'Code editor',
        action: 'Delete line',
        keys: 'Mod+Shift+K',
    },

    'editor.insertLineAbove': {
        group: 'Code editor',
        action: 'Insert line above',
        keys: 'Mod+Shift+Enter',
    },

    'editor.indentLine': {
        group: 'Code editor',
        action: 'Indent or outdent line',
        keys: 'Mod+]/[',
    },

    'editor.addCursorAbove': {
        group: 'Code editor',
        action: 'Add cursor above or below',
        keys: 'Mod+Alt+Up/Down',
    },

    'editor.columnSelection': {
        group: 'Code editor',
        action: 'Column selection',
        keys: 'Shift+Alt+Drag',
    },

    'editor.expandSelection': {
        group: 'Code editor',
        action: 'Expand or shrink selection',
        keys: 'Shift+Alt+Left/Right',
    },

    'editor.matchingBracket': {
        group: 'Code editor',
        action: 'Go to matching bracket',
        keys: 'Mod+Shift+\\',
    },

    'editor.fold': {
        group: 'Code editor',
        action: 'Fold',
        keys: 'Mod+Alt+[',
        windows: 'Ctrl+Shift+[',
    },

    'editor.unfold': {
        group: 'Code editor',
        action: 'Unfold',
        keys: 'Mod+Alt+]',
        windows: 'Ctrl+Shift+]',
    },

    'editor.wordWrap': {
        group: 'Code editor',
        action: 'Toggle word wrap',
        keys: 'Alt+Z',
    },

    'editor.toggleComment': {
        group: 'Code editor',
        action: 'Switch lines on or off (comment with //)',
        keys: 'Mod+/',
    },

    'editor.undo': {
        group: 'Code editor',
        action: 'Undo',
        keys: 'Mod+Z',
    },

    'editor.redo': {
        group: 'Code editor',
        action: 'Redo',
        keys: 'Mod+Shift+Z',
        windows: 'Mod+Y',
    },

    'editor.leave': {
        group: 'Code editor',
        action: 'Leave the editor with Tab',
        keys: 'Escape Tab',
    },
} satisfies Record<string, Shortcut>

export type ShortcutId = keyof typeof SHORTCUTS

// ===================================================================
//
//   Showing keys
//
// ===================================================================

const MAC_NAMES: Record<string, string> = {
    Mod: '⌘',
    Ctrl: '⌃',
    Alt: '⌥',
    Shift: '⇧',
    Enter: '↵',
    Escape: 'Esc',
    Delete: 'Del',
}

const WINDOWS_NAMES: Record<string, string> = {
    Mod: 'Ctrl',
    Escape: 'Esc',
}

const SHARED_NAMES: Record<string, string> = {
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    'Up/Down': '↑ ↓',
    'Left/Right': '← →',
    ']/[': '] [',
}

/** Apple writes modifiers ⌃ ⌥ ⇧ ⌘; Windows writes Ctrl, Alt, Shift. */
const ORDER: Record<Platform, string[]> = {
    mac: ['Ctrl', 'Alt', 'Shift', 'Mod'],
    windows: ['Mod', 'Ctrl', 'Alt', 'Shift'],
}

export function detectPlatform(): Platform {
    const isMac = /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent)

    return isMac ? 'mac' : 'windows'
}

/** The keys of a shortcut as they are shown on `platform`, one entry per key. */
export function keysFor(shortcut: Shortcut, platform: Platform): string[] {
    const written = platform === 'windows' ? (shortcut.windows ?? shortcut.keys) : shortcut.keys
    const names = platform === 'mac' ? MAC_NAMES : WINDOWS_NAMES
    const order = ORDER[platform]

    // `Escape Tab` is two shortcuts in a row.
    return written.split(' ').flatMap((combo) => {
        const parts = combo.split(/\+(?!$)/)

        const modifiers = parts
            .filter((part) => order.includes(part))
            .sort((a, b) => order.indexOf(a) - order.indexOf(b))

        const rest = parts.filter((part) => !order.includes(part))

        return [...modifiers, ...rest].map((part) => names[part] ?? SHARED_NAMES[part] ?? part)
    })
}

/** The shortcuts of each group, in the order Settings › Shortcuts lists them. */
export function shortcutGroups(): {
    title: Shortcut['group']
    shortcuts: Shortcut[]
}[] {
    const groups = new Map<Shortcut['group'], Shortcut[]>()
    const shortcuts = Object.values(SHORTCUTS) as Shortcut[]

    shortcuts.forEach((shortcut) => {
        const inGroup = groups.get(shortcut.group) ?? []

        groups.set(shortcut.group, [...inGroup, shortcut])
    })

    return [...groups].map(([title, inGroup]) => ({
        title,
        shortcuts: inGroup,
    }))
}

// ===================================================================
//
//   Matching key presses
//
// ===================================================================

/** The physical key of a symbol, so it matches whatever character ⌥ makes of it. */
const CODES: Record<string, string> = {
    ',': 'Comma',
    '\\': 'Backslash',
    '/': 'Slash',
    '[': 'BracketLeft',
    ']': 'BracketRight',
}

type KeyPress = Pick<KeyboardEvent, 'key' | 'code' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'>

/** Whether a key press is the shortcut. ⌘ and Ctrl both count as `Mod`, on any computer. */
export function matchesShortcut(event: KeyPress, id: ShortcutId): boolean {
    const parts = SHORTCUTS[id].keys.split(/\+(?!$)/)
    const key = parts.at(-1)!

    // Modifiers must match exactly.

    const wantsMod = parts.includes('Mod')

    if (wantsMod !== (event.metaKey || event.ctrlKey)) {
        return false
    }

    if (parts.includes('Alt') !== event.altKey) {
        return false
    }

    if (parts.includes('Shift') !== event.shiftKey) {
        return false
    }

    // A symbol: by the physical key.

    if (key in CODES) {
        return event.code === CODES[key]
    }

    // A letter: by the character, so other keyboard layouts work, unless ⌥ changed it.

    if (/^[A-Z]$/.test(key)) {
        return event.altKey ? event.code === `Key${key}` : event.key.toUpperCase() === key
    }

    // Any other key, with the number pad's Enter counting as Enter.

    return event.key === key || (key === 'Enter' && event.code === 'NumpadEnter')
}
