import { useEffect } from 'react'

import { closeTab, useUi, useWorkspace } from '@/stores'

/** Closes tabs whose item or environment was deleted, here or by a collaborator. */
export function useCloseOrphanedTabs(workspaceId: string): void {
    const tabs = useUi((state) => state.tabs)
    const items = useWorkspace((state) => state.items)
    const environments = useWorkspace((state) => state.environments)
    const isLoaded = useWorkspace((state) => state.connection === 'connected')

    useEffect(() => {
        if (!isLoaded) {
            return
        }

        for (const tab of tabs) {
            let exists = tab.id === workspaceId

            if (tab.kind === 'item') {
                exists = tab.id in items
            } else if (tab.kind === 'environment') {
                exists = tab.id in environments
            }

            if (!exists) {
                closeTab(tab)
            }
        }
    }, [tabs, items, environments, isLoaded, workspaceId])
}
