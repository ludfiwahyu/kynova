import { useRef } from 'react'

import { useEnterAnimation } from '@/hooks'
import { PANEL_ENTER, RIGHT_PANELS } from '@/layouts/Workbench/logic/config'
import { toRailItems } from '@/layouts/Workbench/logic/mappers'
import { closeRightPanel, toggleRightPanel, useUi, useWorkspace } from '@/stores'

export function useRightPanel() {
    const panel = useUi((state) => state.rightPanel)
    const activeTab = useUi((state) => state.activeTab)
    const item = useWorkspace((state) =>
        activeTab?.kind === 'item' ? state.items[activeTab.id] : undefined,
    )
    const commentCount = useWorkspace((state) =>
        item
            ? Object.values(state.comments).filter((comment) => comment.itemId === item.id).length
            : 0,
    )

    // Slides in from the right when it opens or shows another panel.
    const panelRef = useRef<HTMLElement>(null)

    useEnterAnimation(panelRef, panel, PANEL_ENTER)

    const title = RIGHT_PANELS.find(({ id }) => id === panel)?.label

    return {
        panel,
        item,
        title,
        panelRef,
        closeLabel: `Close ${title}`,
        rail: toRailItems(panel, commentCount),
        close: closeRightPanel,
        toggle: toggleRightPanel,
    }
}
