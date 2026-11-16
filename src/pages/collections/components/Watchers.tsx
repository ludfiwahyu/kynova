import { useWatchers } from '@/pages/collections/hooks/useWatchers'
import type { WatchersProps } from '@/pages/collections/types'

export function Watchers({ itemId }: WatchersProps) {
    const watchers = useWatchers(itemId)

    return (
        <span className="watchers">
            {watchers.map((person) => (
                <span
                    key={person.userId}
                    className="watcher"
                    style={{ background: person.color }}
                    title={`${person.name} is here`}
                />
            ))}
        </span>
    )
}
