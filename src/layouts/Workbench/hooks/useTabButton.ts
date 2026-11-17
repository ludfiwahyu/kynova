import type { KeyboardEvent, MouseEvent } from 'react'
import { useEffect, useRef } from 'react'

import { useTabLabel } from '@/layouts/Workbench/hooks/useTabLabel'
import type { TabButtonProps } from '@/layouts/Workbench/types'
import { usePreferences } from '@/settings'
import { isSameTab, keepTab, moveTab, openTab, useDraft, useUi } from '@/stores'

export function useTabButton({ tab, register, onClose }: TabButtonProps) {
    const label = useTabLabel(tab)
    const isActive = useUi((state) => isSameTab(state.activeTab, tab))
    const isPreview = useUi((state) => isSameTab(state.previewTab, tab))
    const showIcon = usePreferences((preferences) => preferences.showTabIcons)
    const isDirty = useDraft(tab.kind === 'item' ? tab.id : undefined).isDirty
    const ref = useRef<HTMLDivElement>(null)

    const previewHint = isPreview ? 'Preview tab: double-click to keep it open' : undefined

    // Keeps the active tab in view when there are more tabs than room.
    useEffect(() => {
        if (isActive) {
            ref.current?.scrollIntoView({
                block: 'nearest',
                inline: 'nearest',
            })
        }
    }, [isActive])

    function attach(element: HTMLDivElement | null) {
        ref.current = element
        register(element)
    }

    function open() {
        openTab(tab, { preview: isPreview })
    }

    function keep() {
        keepTab(tab)
    }

    function handleAuxClick(event: MouseEvent) {
        if (event.button === 1) {
            onClose()
        }
    }

    // ⌘ or Ctrl + Shift + ← →: moves the tab along the strip.
    function handleKeyDown(event: KeyboardEvent) {
        const step = {
            ArrowLeft: -1,
            ArrowRight: 1,
        }[event.key]

        if (!step || !event.shiftKey || !(event.metaKey || event.ctrlKey)) {
            return
        }

        event.preventDefault()

        const { tabs } = useUi.getState()

        moveTab(tab, tabs.findIndex((open) => isSameTab(open, tab)) + step)
    }

    return {
        isDirty,
        label,
        isActive,
        isPreview,
        showIcon,
        previewHint,
        closeLabel: `Close ${label?.name}`,
        attach,
        open,
        keep,
        handleAuxClick,
        handleKeyDown,
    }
}
