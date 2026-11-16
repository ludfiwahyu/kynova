import { useSession, useWorkspace } from '@/stores'

export function useWatchers(itemId: string) {
    const selfId = useSession((state) => state.user?.id)
    const presence = useWorkspace((state) => state.presence)

    const watchers = presence.filter(
        (person) => person.itemId === itemId && person.userId !== selfId,
    )

    return [...new Map(watchers.map((person) => [person.userId, person])).values()]
}
