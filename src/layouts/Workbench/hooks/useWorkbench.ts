import type { CSSProperties } from 'react'
import { useEffect, useRef } from 'react'

import { useCloseOrphanedTabs } from '@/layouts/Workbench/hooks/useCloseOrphanedTabs'
import { useGlobalShortcuts } from '@/layouts/Workbench/hooks/useGlobalShortcuts'
import { useNarrowScreen } from '@/layouts/Workbench/hooks/useNarrowScreen'
import { useOpenPendingLink } from '@/layouts/Workbench/hooks/useOpenPendingLink'
import { useWorkbenchResize } from '@/layouts/Workbench/hooks/useWorkbenchResize'
import {
    closeAllTabs,
    closeRightPanel,
    connect,
    disconnect,
    isNarrowScreen,
    NARROW_SCREEN,
    setFocus,
    setLayout,
    useUi,
} from '@/stores'

export function useWorkbench(workspaceId: string) {
    const activeTab = useUi((state) => state.activeTab)
    const layout = useUi((state) => state.layout)
    const rightPanel = useUi((state) => state.rightPanel)
    const bottomPanel = useUi((state) => state.bottomPanel)
    const narrow = useNarrowScreen()
    const mainRef = useRef<HTMLElement>(null)

    // A narrow window has no room beside the work, so the panel goes below it there.
    const consoleDock = narrow ? 'bottom' : layout.consoleDock
    const consoleSide = bottomPanel && consoleDock !== 'bottom' ? consoleDock : null

    const resize = useWorkbenchResize(layout, consoleSide, mainRef)

    useEffect(() => {
        connect(workspaceId)

        return () => {
            disconnect()
            closeAllTabs()
        }
    }, [workspaceId])

    useEffect(() => {
        setFocus(activeTab?.kind === 'item' ? activeTab.id : null)

        // On a narrow screen the sidebar floats over the work, so opening something puts it away.
        if (activeTab && isNarrowScreen()) {
            setLayout({ sidebarOpen: false })
        }
    }, [activeTab])

    // Shrinking the window to narrow with both panels open would stack them; keep the sidebar.
    useEffect(() => {
        const query = matchMedia(NARROW_SCREEN)

        function onChange() {
            const { layout: current, rightPanel: panel } = useUi.getState()

            if (query.matches && current.sidebarOpen && panel) {
                closeRightPanel()
            }
        }

        onChange()
        query.addEventListener('change', onChange)

        return () => query.removeEventListener('change', onChange)
    }, [])

    useCloseOrphanedTabs(workspaceId)
    useOpenPendingLink()
    useGlobalShortcuts()

    // Sizes live in custom properties, so a drag updates one value and the grid follows.
    const shellStyle = {
        '--sidebar-width': `${layout.sidebarOpen ? layout.sidebarWidth : 0}px`,
        '--right-panel-width': `${rightPanel ? layout.rightPanelWidth : 0}px`,
        // The width it opens to, so its content keeps its layout while the column grows.
        '--right-panel-open': `${layout.rightPanelWidth}px`,
        '--bottom-panel-height': `${bottomPanel && !consoleSide ? layout.bottomPanelHeight : 0}px`,
        '--console-left-width': `${consoleSide === 'left' ? layout.consoleWidth : 0}px`,
        '--console-right-width': `${consoleSide === 'right' ? layout.consoleWidth : 0}px`,
    } as CSSProperties

    function workArea() {
        return mainRef.current
    }

    return {
        mainRef,
        shellStyle,
        consoleDock,
        consoleSide,
        sidebarOpen: layout.sidebarOpen,
        hasRightPanel: Boolean(rightPanel),
        hasBottomBelow: Boolean(bottomPanel && !consoleSide),
        consoleResizeClass: `console-resize console-resize-${consoleSide}`,
        resize,
        workArea,
    }
}
