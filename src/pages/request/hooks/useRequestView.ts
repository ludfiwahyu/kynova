import { useVariableContext } from '@/hooks'
import type { RequestViewProps } from '@/pages/request/types'
import { keepTab } from '@/stores'

export function useRequestView({ item }: RequestViewProps) {
    // The URL, params, headers and auth fields suggest and show the variables there are.
    const variableContext = useVariableContext(item)

    const httpItem = item.kind === 'http' ? item : null
    const socketItem = item.kind === 'websocket' ? item : null

    // Typing anywhere in a preview tab keeps it open.
    function keepOpen() {
        keepTab({
            kind: 'item',
            id: item.id,
        })
    }

    return {
        variableContext,
        httpItem,
        socketItem,
        keepOpen,
    }
}
