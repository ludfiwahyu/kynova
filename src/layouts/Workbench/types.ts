import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import type { RefObject } from 'react'

import type { Dock, RightPanel as PanelId, Tab } from '@/stores'
import type { Issue } from '@/utils'
import type { Environment, Item } from '#shared/types.ts'

export interface BottomPanelProps {
    dock: Dock
    workArea: () => HTMLElement | null
}

export interface TabButtonProps {
    tab: Tab
    register: (element: HTMLDivElement | null) => void
    onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
    onClose: () => void
}

export interface WorkspaceLine {
    id: string
    name: string
    isActive: boolean
    iconStyle: CSSProperties
}

export type WorkspaceDialog = 'create' | 'rename' | null

export interface SearchRow {
    id: string
    domId: string
    item: Item
    path: string
    isSelected: boolean
}

export interface RightPanelContentProps {
    panel: PanelId
    item: Item | undefined
}

export type ContentKind =
    'open' | 'docs' | 'comments' | 'commentsNote' | 'code' | 'codeNote' | 'variables'

export interface RailItem {
    id: PanelId
    label: string
    icon: ReactNode
    isPressed: boolean
    count: number
}

export interface TabLabel {
    name: string
    kind: 'item' | 'environment' | 'workspace'
    item?: Item
    environment?: Environment
}

export interface TabGlyphProps {
    label: TabLabel
}

export interface TabListItemProps {
    tab: Tab
}

export interface TabLayout {
    stripRef: RefObject<HTMLDivElement | null>
    elements: RefObject<Map<string, HTMLDivElement>>
    lastLeft: RefObject<Map<string, number>>
    drag: RefObject<{
        key: string
        screenLeft: number
    } | null>
}

export type ConsoleFilter = 'all' | 'problems'

export interface HeaderListProps {
    headers: [string, string][]
}

export interface ConsoleRowView {
    id: string
    time: string
    method: string
    url: string
    source: string
    isProblem: boolean
    hasResponse: boolean
    status: string
    tone: string
    duration: string
    errorText: string
    requestHeaders: [string, string][]
    requestBody: string | null
    requestBodyText: string
    responseHeaders: [string, string][]
    responseBody: string
    error: string | undefined
}

export interface ConsoleViewProps {
    filter: ConsoleFilter
}

export interface ConsoleRowProps {
    row: ConsoleRowView
    isOpen: boolean
    onToggle: () => void
}

export interface ConsoleDetailProps {
    row: ConsoleRowView
}

export interface IssuesViewProps {
    issues: Issue[]
}

export interface IssueRowView {
    key: number
    issue: Issue
    icon: ReactNode
}

export interface IssueCounts {
    errors: string
    warnings: string
}

export interface WorkbenchProps {
    workspaceId: string
}

export interface TopBarMoreMenuProps {
    onInvite: () => void
}
