import { toHistoryDays } from '@/pages/history/logic/mappers'
import { clearHistory, openTab, useUi, useWorkspace, useWorkspaceId } from '@/stores'

export function useHistoryView() {
    const workspaceId = useWorkspaceId()
    const history = useUi((state) => state.history)
    const items = useWorkspace((state) => state.items)

    const entries = history.filter((entry) => entry.workspaceId === workspaceId)
    const days = toHistoryDays(entries, items)
    const isEmpty = entries.length === 0

    function clear() {
        clearHistory(workspaceId)
    }

    function open(itemId: string) {
        openTab({
            kind: 'item',
            id: itemId,
        })
    }

    return {
        days,
        isEmpty,
        clear,
        open,
    }
}
