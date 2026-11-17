/** Interface state that belongs to this browser only and is never synced. */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { STORAGE_KEYS } from '@/constants'
import { usePreferences } from '@/settings'
import type { HttpMethod } from '#shared/types.ts'

const MAX_HISTORY = 200

export type SidebarView = 'collections' | 'environments' | 'history'
export type RightPanel = 'docs' | 'comments' | 'code' | 'variables'
export type SidebarSection = 'collections' | 'environments' | 'archive'
export type SettingsSection = 'general' | 'editor' | 'themes' | 'shortcuts' | 'account' | 'about'

/** An open tab: a collection, folder or request (`item`), an environment, or the workspace itself. */
export interface Tab {
    kind: 'item' | 'environment' | 'workspace'
    id: string
}

/** What a link opened the app with: a tab to open once the workspace loads, or why it cannot be. */
export interface PendingLink {
    tab?: Tab
    notice?: string
}

export interface HistoryEntry {
    id: string
    workspaceId: string
    itemId: string
    name: string
    method: HttpMethod
    url: string
    /** `null` when no response arrived. */
    status: number | null
    at: number
}

/** Sizes of the resizable areas, in pixels or as a share of the space. */
export interface Layout {
    sidebarOpen: boolean
    sidebarWidth: number
    rightPanelWidth: number
    /** The request editor's share of the height it splits with the response. */
    requestShare: number
    /** The height of the Console and Issues panel. */
    bottomPanelHeight: number
    /** Where the response sits beside the request editor. */
    responseDock: Dock
    /** The request editor's share of the width when the response sits beside it. */
    requestWidthShare: number
    /** Where the Console and Issues panel sits beside the work area. */
    consoleDock: Dock
    /** The width of the Console and Issues panel when it sits beside the work area. */
    consoleWidth: number
}

/** Where a movable panel sits next to its neighbour. */
export type Dock = 'bottom' | 'left' | 'right'

/** The tabs of the panel under the work area. */
export type BottomPanel = 'console' | 'issues'

interface UiState {
    sidebar: SidebarView
    /** The selected environment of each workspace, by workspace id. */
    environmentByWorkspace: Record<string, string | null>
    history: HistoryEntry[]
    tabs: Tab[]
    activeTab: Tab | null
    /**
     * The preview tab: opened by a single click, shown in italics, and replaced by
     * the next single click. Editing it or double-clicking it makes it permanent.
     */
    previewTab: Tab | null
    /** Ids of open collections and folders. Everything starts folded. */
    expanded: Record<string, boolean>
    collapsedSections: Partial<Record<SidebarSection, boolean>>
    rightPanel: RightPanel | null
    bottomPanel: BottomPanel | null
    layout: Layout
    pendingLink: PendingLink | null
    /** An item just created whose name should open for typing, in its tab or its tree row. */
    editNameOf: string | null
    /** A variable the Variables panel should bring into view and focus; `at` makes a repeat count. */
    revealedVariable: {
        name: string
        at: number
    } | null
    /** The section the workspace tab shows. */
    workspaceSection: 'overview' | 'settings'
    /** The open section of app Settings, or `null` while Settings is closed. */
    settingsSection: SettingsSection | null
}

/** Below this width the sidebar and side panel float over the work. Kept in step with shell.css. */
export const NARROW_SCREEN = '(max-width: 900px)'

/** On a narrow screen only one floating panel fits, so opening one closes the other. */
export function isNarrowScreen(): boolean {
    return typeof matchMedia === 'function' && matchMedia(NARROW_SCREEN).matches
}

export const DEFAULT_LAYOUT: Layout = {
    sidebarOpen: true,
    sidebarWidth: 300,
    rightPanelWidth: 340,
    requestShare: 0.45,
    bottomPanelHeight: 260,
    responseDock: 'bottom',
    requestWidthShare: 0.5,
    consoleDock: 'bottom',
    consoleWidth: 420,
}

export function isSameTab(a: Tab | null, b: Tab | null): boolean {
    return a?.kind === b?.kind && a?.id === b?.id
}

export const useUi = create<UiState>()(
    persist(
        (): UiState => ({
            sidebar: 'collections',
            environmentByWorkspace: {},
            history: [],
            tabs: [],
            activeTab: null,
            previewTab: null,
            expanded: {},
            // The sections below the collections start folded.
            collapsedSections: { environments: true },
            rightPanel: null,
            bottomPanel: null,
            layout: DEFAULT_LAYOUT,
            pendingLink: null,
            editNameOf: null,
            revealedVariable: null,
            workspaceSection: 'overview',
            settingsSection: null,
        }),
        {
            name: STORAGE_KEYS.ui,
            // Tabs point into one workspace's documents, so they are not kept across reloads.
            partialize: ({
                sidebar,
                environmentByWorkspace,
                history,
                collapsedSections,
                layout,
            }) => ({
                sidebar,
                environmentByWorkspace,
                history,
                collapsedSections,
                layout,
            }),
            merge: (persisted, current) => {
                const saved = persisted as Partial<UiState>

                return {
                    ...current,
                    ...saved,
                    layout: {
                        ...DEFAULT_LAYOUT,
                        ...saved.layout,
                    },
                }
            },
        },
    ),
)

export function setSidebar(sidebar: SidebarView): void {
    useUi.setState((state) => ({
        sidebar,
        layout: {
            ...state.layout,
            sidebarOpen: true,
        },
        rightPanel: isNarrowScreen() ? null : state.rightPanel,
    }))
}

export function selectEnvironment(workspaceId: string, environmentId: string | null): void {
    useUi.setState((state) => ({
        environmentByWorkspace: {
            ...state.environmentByWorkspace,
            [workspaceId]: environmentId,
        },
    }))
}

export function toggleSection(section: SidebarSection): void {
    useUi.setState((state) => ({
        collapsedSections: {
            ...state.collapsedSections,
            [section]: !state.collapsedSections[section],
        },
    }))
}

// ── Layout ───────────────────────────────────────────────────────────────

export function setLayout(changes: Partial<Layout>): void {
    useUi.setState((state) => ({
        layout: {
            ...state.layout,
            ...changes,
        },
    }))
}

export function toggleSidebarOpen(): void {
    useUi.setState((state) => {
        const sidebarOpen = !state.layout.sidebarOpen

        return {
            layout: {
                ...state.layout,
                sidebarOpen,
            },
            rightPanel: sidebarOpen && isNarrowScreen() ? null : state.rightPanel,
        }
    })
}

/** Opens the panel, or closes it when it is the one already open. */
export function toggleRightPanel(panel: RightPanel): void {
    useUi.setState((state) => {
        const rightPanel = state.rightPanel === panel ? null : panel
        const closeSidebar = rightPanel !== null && isNarrowScreen()

        return {
            rightPanel,
            layout: closeSidebar
                ? {
                      ...state.layout,
                      sidebarOpen: false,
                  }
                : state.layout,
        }
    })
}

/** Opens the panel, leaving it open when it already is. */
export function openRightPanel(panel: RightPanel): void {
    if (useUi.getState().rightPanel !== panel) {
        toggleRightPanel(panel)
    }
}

/** Opens the Variables panel and asks it to focus `name`'s value, where it is defined. */
export function revealVariable(name: string): void {
    openRightPanel('variables')
    useUi.setState({
        revealedVariable: {
            name,
            at: Date.now(),
        },
    })
}

export function variableRevealed(): void {
    useUi.setState({ revealedVariable: null })
}

export function closeRightPanel(): void {
    useUi.setState({ rightPanel: null })
}

/** Opens the Console or Issues, or closes the panel when that tab is already showing. */
export function toggleBottomPanel(panel: BottomPanel): void {
    useUi.setState((state) => ({ bottomPanel: state.bottomPanel === panel ? null : panel }))
}

export function setBottomPanel(panel: BottomPanel | null): void {
    useUi.setState({ bottomPanel: panel })
}

// ── Tabs ─────────────────────────────────────────────────────────────────

export interface OpenTabOptions {
    /** Single click in the sidebar: takes the place of the preview tab, if there is one. */
    preview?: boolean
    /** Where the tab goes in the strip (a drop on it); also moves a tab that is already open. */
    at?: number
    /** Opens without switching to it (middle click); the first tab opened still becomes active. */
    background?: boolean
}

/**
 * Opens a tab, or switches to it when it is already open.
 * Only a preview opening replaces anything, and only the preview tab: open tabs stay.
 */
export function openTab(
    tab: Tab,
    { preview: asPreview = false, at, background = false }: OpenTabOptions = {},
): void {
    // Settings › General can turn preview tabs off.
    const preview = asPreview && !usePreferences.getState().alwaysOpenInNewTab

    useUi.setState((state) => {
        const activeTab = background && state.activeTab ? state.activeTab : tab
        const tabs = state.tabs.filter((open) => !isSameTab(open, tab))
        const isOpen = tabs.length < state.tabs.length

        if (isOpen) {
            // Opening an open tab for real (double-click, edit, drop) makes it permanent.
            const isPreview = isSameTab(state.previewTab, tab)

            if (at !== undefined) {
                tabs.splice(Math.min(at, tabs.length), 0, tab)
            }

            return {
                tabs: at === undefined ? state.tabs : tabs,
                activeTab,
                previewTab: isPreview && !preview ? null : state.previewTab,
            }
        }

        const previewIndex = state.previewTab
            ? tabs.findIndex((open) => isSameTab(open, state.previewTab))
            : -1

        if (preview && previewIndex !== -1) {
            tabs[previewIndex] = tab
        } else {
            tabs.splice(Math.min(at ?? tabs.length, tabs.length), 0, tab)
        }

        return {
            tabs,
            activeTab,
            previewTab: preview ? tab : state.previewTab,
        }
    })
}

/** Makes the tab permanent, if it is the preview tab. */
export function keepTab(tab: Tab): void {
    useUi.setState((state) => (isSameTab(state.previewTab, tab) ? { previewTab: null } : {}))
}

export function closeTab(tab: Tab): void {
    useUi.setState((state) => {
        const index = state.tabs.findIndex((open) => isSameTab(open, tab))
        const tabs = state.tabs.filter((open) => !isSameTab(open, tab))
        const wasActive = isSameTab(state.activeTab, tab)

        return {
            tabs,
            // Closing the active tab moves to its right-hand neighbour, or the new last tab.
            activeTab: wasActive ? (tabs[index] ?? tabs.at(-1) ?? null) : state.activeTab,
            previewTab: isSameTab(state.previewTab, tab) ? null : state.previewTab,
        }
    })
}

/** Puts `tab` at position `index` of the tab strip, moving the others along. */
export function moveTab(tab: Tab, index: number): void {
    useUi.setState((state) => {
        const from = state.tabs.findIndex((open) => isSameTab(open, tab))

        if (from === -1) {
            return {}
        }

        const tabs = state.tabs.filter((_, i) => i !== from)
        const to = Math.max(0, Math.min(index, tabs.length))

        if (to === from) {
            return {}
        }

        tabs.splice(to, 0, state.tabs[from])

        return { tabs }
    })
}

export function closeOtherTabs(tab: Tab): void {
    useUi.setState((state) => ({
        tabs: state.tabs.filter((open) => isSameTab(open, tab)),
        activeTab: tab,
        previewTab: isSameTab(state.previewTab, tab) ? tab : null,
    }))
}

export function closeAllTabs(): void {
    useUi.setState({
        tabs: [],
        activeTab: null,
        previewTab: null,
    })
}

export function toggleExpanded(id: string): void {
    useUi.setState((state) => ({
        expanded: {
            ...state.expanded,
            [id]: !state.expanded[id],
        },
    }))
}

export function expand(id: string): void {
    useUi.setState((state) =>
        state.expanded[id]
            ? {}
            : {
                  expanded: {
                      ...state.expanded,
                      [id]: true,
                  },
              },
    )
}

export function openSettings(section: SettingsSection = 'general'): void {
    useUi.setState({ settingsSection: section })
}

export function closeSettings(): void {
    useUi.setState({ settingsSection: null })
}

export function setPendingLink(pendingLink: PendingLink | null): void {
    useUi.setState({ pendingLink })
}

/** Marks a new item so its name opens for typing as soon as it shows. */
export function editNameSoon(itemId: string): void {
    useUi.setState({ editNameOf: itemId })
}

export function nameEdited(): void {
    useUi.setState({ editNameOf: null })
}

export function openWorkspaceTab(workspaceId: string, section: 'overview' | 'settings'): void {
    useUi.setState({ workspaceSection: section })
    openTab({
        kind: 'workspace',
        id: workspaceId,
    })
}

// ── History ──────────────────────────────────────────────────────────────

export function addHistory(entry: HistoryEntry): void {
    useUi.setState((state) => ({ history: [entry, ...state.history].slice(0, MAX_HISTORY) }))
}

export function clearHistory(workspaceId: string): void {
    useUi.setState((state) => ({
        history: state.history.filter((entry) => entry.workspaceId !== workspaceId),
    }))
}
