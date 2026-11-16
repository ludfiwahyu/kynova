import type { ContentKind } from '@/layouts/Workbench/types'
import type { RightPanel as PanelId } from '@/stores'
import {
    createCollection,
    createHttpRequest,
    editNameSoon,
    expand,
    openTab,
    type Tab,
    useUi,
    useWorkspace,
} from '@/stores'
import { childrenOf, rootCollection } from '@/utils'
import type { Item } from '#shared/types.ts'

export function matchesQuery(item: Item, query: string): boolean {
    let url = ''

    if (item.kind === 'http') {
        url = item.request.url
    } else if (item.kind === 'websocket') {
        url = item.url
    }

    return `${item.name} ${url}`.toLowerCase().includes(query)
}

export function panelContentKind(panel: PanelId, item: Item | undefined): ContentKind {
    // Variables belong to the workspace's environments, so they show without an open item.
    if (panel === 'variables') {
        return 'variables'
    }

    if (!item) {
        return 'open'
    }

    if (panel === 'docs') {
        return 'docs'
    }

    const isRequest = item.kind === 'http' || item.kind === 'websocket'

    if (panel === 'comments') {
        return isRequest ? 'comments' : 'commentsNote'
    }

    return item.kind === 'http' ? 'code' : 'codeNote'
}

export function tabKey(tab: Tab): string {
    return `${tab.kind}:${tab.id}`
}

/** Creates a request in the collection of the open tab, or in the first collection. */
export function newRequest(): void {
    const { items } = useWorkspace.getState()
    const { activeTab } = useUi.getState()

    const activeItem = activeTab?.kind === 'item' ? items[activeTab.id] : undefined
    const collection =
        (activeItem && rootCollection(items, activeItem)) ??
        childrenOf(items, null)[0] ??
        createCollection()

    const created = createHttpRequest(collection.id)

    expand(collection.id)
    editNameSoon(created.id)
    openTab({
        kind: 'item',
        id: created.id,
    })
}

export function clamp(
    value: number,
    {
        min,
        max,
    }: {
        min: number
        max: number
    },
): number {
    return Math.min(max, Math.max(min, value))
}
