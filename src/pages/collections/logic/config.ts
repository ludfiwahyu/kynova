import { detectPlatform } from '@/settings'
import type { Item } from '#shared/types.ts'

export const KIND_LABEL = {
    collection: 'collection',
    folder: 'folder',
    http: 'request',
    websocket: 'request',
}

export const isContainer = (item: Item) => item.kind === 'collection' || item.kind === 'folder'

export const isRequest = (item: Item) => item.kind === 'http' || item.kind === 'websocket'

export const plural = (count: number, one: string, many: string) =>
    `${count} ${count === 1 ? one : many}`

/** ⌘ on a Mac (where Ctrl-click is a right click), Ctrl on Windows and Linux. */
export const IS_MAC = typeof navigator !== 'undefined' && detectPlatform() === 'mac'

/** Pixels per nesting level. Kept in step with `.tree-row` padding in sidebar.css. */
export const INDENT = 16

export const TOOLBAR_ICON_SIZE = 16

export const ACTIONS_ICON_SIZE = 15

export const MENU_ICON_SIZE = 14

export const GLIDE_SECONDS = 0.18

export const IMPORT_ACCEPT = '.json,application/json'

export const CHEVRON_ICON_SIZE = 14

export const GROUP_ENTER = {
    y: -4,
    duration: 0.16,
}

export const EMPTY_NOTE_BASE_PADDING = 30
