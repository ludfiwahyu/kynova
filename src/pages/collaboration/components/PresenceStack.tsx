import { Avatar } from '@/components'
import { usePresenceStack } from '@/pages/collaboration/hooks/usePresenceStack'
import type { PresenceStackProps } from '@/pages/collaboration/types'

export function PresenceStack({ itemId }: PresenceStackProps) {
    const presence = usePresenceStack(itemId)

    if (presence.isEmpty) {
        return null
    }

    return (
        <div
            className="presence"
            aria-label={presence.label}
        >
            {presence.people.map((person) => (
                <Avatar
                    key={person.userId}
                    name={person.name}
                    color={person.color}
                />
            ))}

            {presence.extra > 0 && <span className="presence-more">+{presence.extra}</span>}
        </div>
    )
}
