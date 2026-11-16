import { useEffect } from 'react'

import { MISSING_LINK_NOTICE } from '@/layouts/Workbench/logic/config'
import { expand, openTab, setPendingLink, useUi, useWorkspace } from '@/stores'

/** Opens the tab a shared link pointed to, once the workspace has loaded. */
export function useOpenPendingLink(): void {
    const pendingLink = useUi((state) => state.pendingLink)
    const isLoaded = useWorkspace((state) => state.connection === 'connected')

    useEffect(() => {
        if (!pendingLink || !isLoaded) {
            return
        }

        setPendingLink(null)

        const { items, environments } = useWorkspace.getState()
        const { tab } = pendingLink

        let exists = true

        if (tab?.kind === 'item') {
            exists = tab.id in items
        } else if (tab?.kind === 'environment') {
            exists = tab.id in environments
        }

        if (!tab || !exists) {
            useWorkspace.setState({ notice: pendingLink.notice ?? MISSING_LINK_NOTICE })

            return
        }

        // Reveal the item in the tree, then open it.
        for (
            let parentId = tab.kind === 'item' ? items[tab.id].parentId : null;
            parentId;
            parentId = items[parentId]?.parentId ?? null
        ) {
            expand(parentId)
        }

        openTab(tab)
    }, [pendingLink, isLoaded])
}
