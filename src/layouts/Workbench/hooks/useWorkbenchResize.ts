import { type RefObject, useRef } from 'react'

import {
    CONSOLE_MIN_WIDTH,
    MIN_BOTTOM_HEIGHT,
    MIN_WORK_HEIGHT,
    MIN_WORK_WIDTH,
    RIGHT_PANEL_WIDTH,
    SIDEBAR_WIDTH,
} from '@/layouts/Workbench/logic/config'
import { clamp } from '@/layouts/Workbench/logic/helpers'
import type { Layout } from '@/stores'
import { DEFAULT_LAYOUT, setLayout } from '@/stores'

export function useWorkbenchResize(
    layout: Layout,
    consoleSide: 'left' | 'right' | null,
    mainRef: RefObject<HTMLElement | null>,
) {
    const dragStart = useRef(0)

    // Sidebar

    function startSidebar() {
        dragStart.current = layout.sidebarWidth
    }

    function dragSidebar(delta: number) {
        setLayout({ sidebarWidth: clamp(dragStart.current + delta, SIDEBAR_WIDTH) })
    }

    function resetSidebar() {
        setLayout({ sidebarWidth: DEFAULT_LAYOUT.sidebarWidth })
    }

    // Right panel

    function startRight() {
        dragStart.current = layout.rightPanelWidth
    }

    function dragRight(delta: number) {
        setLayout({ rightPanelWidth: clamp(dragStart.current - delta, RIGHT_PANEL_WIDTH) })
    }

    function resetRight() {
        setLayout({ rightPanelWidth: DEFAULT_LAYOUT.rightPanelWidth })
    }

    // Console beside the work area

    function startConsole() {
        dragStart.current = layout.consoleWidth
    }

    function dragConsole(delta: number) {
        const max = Math.max(
            CONSOLE_MIN_WIDTH,
            layout.consoleWidth + (mainRef.current?.clientWidth ?? 0) - MIN_WORK_WIDTH,
        )
        const width = dragStart.current + (consoleSide === 'left' ? delta : -delta)

        setLayout({
            consoleWidth: clamp(width, {
                min: CONSOLE_MIN_WIDTH,
                max,
            }),
        })
    }

    function resetConsole() {
        setLayout({ consoleWidth: DEFAULT_LAYOUT.consoleWidth })
    }

    // Console below the work area

    function startBottom() {
        dragStart.current = layout.bottomPanelHeight
    }

    function dragBottom(delta: number) {
        setLayout({
            bottomPanelHeight: clamp(dragStart.current - delta, {
                min: MIN_BOTTOM_HEIGHT,
                max: Math.max(MIN_BOTTOM_HEIGHT, innerHeight - MIN_WORK_HEIGHT),
            }),
        })
    }

    function resetBottom() {
        setLayout({ bottomPanelHeight: DEFAULT_LAYOUT.bottomPanelHeight })
    }

    return {
        startSidebar,
        dragSidebar,
        resetSidebar,
        startRight,
        dragRight,
        resetRight,
        startConsole,
        dragConsole,
        resetConsole,
        startBottom,
        dragBottom,
        resetBottom,
    }
}
