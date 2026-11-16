import { visibleRows } from '@/pages/collections/logic/helpers'
import type { TreeOrder } from '@/pages/collections/types'
import { useUi } from '@/stores'

export function treeOrder(row: HTMLElement): TreeOrder {
    const order = visibleRows(row).map((each) => each.dataset.itemId!)
    const tab = useUi.getState().activeTab
    const openId = tab?.kind === 'item' && order.includes(tab.id) ? tab.id : null

    return {
        order,
        openId,
    }
}
