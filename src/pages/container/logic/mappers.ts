import { containerPage } from '@/pages/container/logic/config'
import type { LiveTab, Section } from '@/pages/container/types'
import type { CollectionItem, FolderItem } from '#shared/types.ts'

function liveTab(item: CollectionItem | FolderItem, id: Section): LiveTab {
    if (id === 'variables' && item.kind === 'collection') {
        return { count: item.variables?.filter((row) => row.enabled && row.key).length }
    }

    if (id === 'scripts') {
        return { dot: Boolean(item.scripts?.preRequest || item.scripts?.test) }
    }

    return {}
}

export function toContainerTabs(item: CollectionItem | FolderItem) {
    return containerPage.tabs
        .filter((tab) => tab.id !== 'variables' || item.kind === 'collection')
        .map((tab) => ({
            ...tab,
            ...liveTab(item, tab.id),
        }))
}
