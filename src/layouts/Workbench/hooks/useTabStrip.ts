import { useRef } from 'react'

import { confirm } from '@/components'
import { useTabDrag } from '@/layouts/Workbench/hooks/useTabDrag'
import { useTabLayout } from '@/layouts/Workbench/hooks/useTabLayout'
import { TAB_LEAVE } from '@/layouts/Workbench/logic/config'
import { newRequest, tabKey } from '@/layouts/Workbench/logic/helpers'
import type { TabLayout } from '@/layouts/Workbench/types'
import {
    closeAllTabs,
    closeTab,
    discardDraft,
    hasUnsavedDraft,
    type Tab,
    useCanEdit,
    useUi,
} from '@/stores'
import { leave } from '@/utils'

export function useTabStrip() {
    const tabs = useUi((state) => state.tabs)
    const canEdit = useCanEdit()

    const layout: TabLayout = {
        stripRef: useRef<HTMLDivElement>(null),
        elements: useRef(new Map<string, HTMLDivElement>()),
        lastLeft: useRef(new Map<string, number>()),
        drag: useRef(null),
    }

    useTabLayout(layout, tabs)
    const startDrag = useTabDrag(layout)

    // Fades the tab out, then closes it; the ones to its right glide over.
    async function closeWithFade(tab: Tab) {
        if (tab.kind === 'item' && hasUnsavedDraft(tab.id)) {
            const discard = await confirm({
                title: 'Discard unsaved changes?',
                message:
                    'This request has changes that are not saved. Closing the tab throws them away; save with ⌘S to keep them.',
                action: 'Discard changes',
            })

            if (!discard) {
                return
            }

            discardDraft(tab.id)
        }

        const element = layout.elements.current.get(tabKey(tab))

        if (!element) {
            closeTab(tab)

            return
        }

        element.inert = true
        void leave(element, TAB_LEAVE).then(() => closeTab(tab))
    }

    function register(tab: Tab, element: HTMLDivElement | null) {
        if (element) {
            layout.elements.current.set(tabKey(tab), element)
        } else {
            layout.elements.current.delete(tabKey(tab))
        }
    }

    return {
        tabs,
        canEdit,
        stripRef: layout.stripRef,
        tabKey,
        startDrag,
        closeWithFade,
        register,
        newRequest,
        closeAll: closeAllTabs,
    }
}
