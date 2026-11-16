import { useRef } from 'react'

import { useEnterAnimation } from '@/hooks'
import { useExplorerDrop } from '@/layouts/Workbench/hooks/useExplorerDrop'
import { TAB_SWITCH } from '@/layouts/Workbench/logic/config'
import { createCollection, openTab, useCanEdit, useDraft, useUi, useWorkspace } from '@/stores'

export function useTabContent() {
    const activeTab = useUi((state) => state.activeTab)
    const item = useWorkspace((state) =>
        activeTab?.kind === 'item' ? state.items[activeTab.id] : undefined,
    )
    const environment = useWorkspace((state) =>
        activeTab?.kind === 'environment' ? state.environments[activeTab.id] : undefined,
    )
    const isLoading = useWorkspace((state) => state.connection === 'connecting')
    const canEdit = useCanEdit()
    const bodyRef = useRef<HTMLDivElement>(null)
    const explorerDrop = useExplorerDrop()

    useEnterAnimation(bodyRef, activeTab && `${activeTab.kind}:${activeTab.id}`, TAB_SWITCH)

    const draft = useDraft(activeTab?.kind === 'item' ? activeTab.id : undefined)
    const requestItem = draft.item
    const containerItem = item && !requestItem ? item : undefined
    const workspaceTab = activeTab?.kind === 'workspace' ? activeTab : undefined

    const hasContent = Boolean(item || environment || workspaceTab)
    const showEmpty = !hasContent && !isLoading

    function newCollection() {
        openTab({
            kind: 'item',
            id: createCollection().id,
        })
    }

    return {
        bodyRef,
        explorerDrop,
        requestItem,
        containerItem: containerItem as Extract<typeof item, { kind: 'collection' | 'folder' }>,
        environment,
        workspaceTab,
        showEmpty,
        canEdit,
        newCollection,
    }
}
