import { isRequest } from '@/pages/request/logic/config'
import { ancestorsOf } from '@/pages/request/logic/helpers'
import type { ItemHeaderProps } from '@/pages/request/types'
import { openTab, useWorkspace, useWorkspaceId } from '@/stores'
import { itemUrl } from '@/utils'

export function useItemHeader({ item }: ItemHeaderProps) {
    const items = useWorkspace((state) => state.items)
    const workspaceId = useWorkspaceId()

    const ancestors = ancestorsOf(items, item)
    const requestItem = isRequest(item) ? item : null
    const shareUrl = itemUrl(workspaceId, 'item', item.id)

    function openAncestor(id: string) {
        openTab({
            kind: 'item',
            id,
        })
    }

    return {
        ancestors,
        requestItem,
        shareUrl,
        openAncestor,
    }
}
