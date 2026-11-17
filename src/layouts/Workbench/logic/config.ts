import {
    BookOpen,
    Braces,
    History,
    LibraryBig,
    MessageCircleMore,
    SlidersHorizontal,
    Variable,
} from 'lucide-react'

import type { Connection, RightPanel as PanelId, SidebarView } from '@/stores'

export const SIDEBAR_VIEWS: {
    id: SidebarView
    label: string
    icon: typeof History
}[] = [
    {
        id: 'collections',
        label: 'Collections',
        icon: LibraryBig,
    },
    {
        id: 'environments',
        label: 'Environments',
        icon: SlidersHorizontal,
    },
    {
        id: 'history',
        label: 'History',
        icon: History,
    },
]

export const SIDEBAR_ICON_SIZE = 17

export const SIDEBAR_ICON_STROKE = 1.75

export const CONNECTION_LABEL: Record<Connection, string> = {
    connecting: 'Connecting…',
    connected: 'Synced',
    offline: 'Offline. Reconnecting… Editing is paused so nothing is lost.',
}

export const STATUS_ICON_SIZE = 14

export const DISMISS_ICON_SIZE = 12

export const EMPTY_ICON_SIZE = 28

export const EMPTY_ICON_STROKE = 1.5

export const TOP_ICON_SIZE = 17

export const MENU_ICON_SIZE = 14

export const INVITE_ICON_SIZE = 15

export const LOGO_SIZE = 22

export const MAX_SEARCH_RESULTS = 8

export const RIGHT_PANELS: {
    id: PanelId
    label: string
    icon: typeof BookOpen
}[] = [
    {
        id: 'docs',
        label: 'Documentation',
        icon: BookOpen,
    },
    {
        id: 'comments',
        label: 'Comments',
        icon: MessageCircleMore,
    },
    {
        id: 'code',
        label: 'Code snippet',
        icon: Braces,
    },
    {
        id: 'variables',
        label: 'Variables',
        icon: Variable,
    },
]

export const SUBJECT = {
    collection: 'collection',
    folder: 'folder',
    http: 'request',
    websocket: 'request',
}

export const RAIL_ICON_SIZE = 17

export const RAIL_ICON_STROKE = 1.75

export const CLOSE_PANEL_ICON_SIZE = 15

export const PANEL_ENTER = {
    x: 16,
    duration: 0.32,
}

/** The contents of a newly chosen tab settle in from just below. */
export const TAB_SWITCH = {
    y: 6,
    duration: 0.26,
}

export const TAB_ENTER = {
    y: -4,
    duration: 0.18,
}

export const TAB_LEAVE = { y: -4 }

export const DRAG_THRESHOLD = 5

export const TAB_ICON_SIZE = 14

export const STRIP_ICON_SIZE = 15

export const NEW_ICON_SIZE = 16

export const TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
})

export const CONSOLE_PLACES = {
    bottom: 'Below the work area',
    left: 'Left of the work area',
    right: 'Right of the work area',
}

export const CONSOLE_FILTERS = [
    {
        value: 'all',
        label: 'All Logs',
    },
    {
        value: 'problems',
        label: 'Errors',
    },
] as const

export const PANEL_RISE = {
    y: 10,
    duration: 0.2,
}

export const AT_BOTTOM_PX = 24

export const CHEVRON_SIZE = 13

export const ISSUE_ICON_SIZE = 14

export const COUNT_ICON_SIZE = 13

export const CLOSE_ICON_SIZE = 15

export const SIDEBAR_WIDTH = {
    min: 220,
    max: 520,
}

export const RIGHT_PANEL_WIDTH = {
    min: 280,
    max: 620,
}

export const CONSOLE_MIN_WIDTH = 320

export const MIN_WORK_WIDTH = 360

export const MIN_WORK_HEIGHT = 220

export const MIN_BOTTOM_HEIGHT = 120

export const MISSING_LINK_NOTICE = 'That link points to something that was deleted.'
