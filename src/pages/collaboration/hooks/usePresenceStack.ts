import { toPresenceView } from '@/pages/collaboration/logic/mappers'
import { useSession, useWorkspace } from '@/stores'

export function usePresenceStack(itemId?: string) {
    const selfId = useSession((state) => state.user?.id)
    const presence = useWorkspace((state) => state.presence)

    const view = toPresenceView(presence, selfId, itemId)

    return {
        ...view,
        isEmpty: view.people.length === 0,
    }
}
