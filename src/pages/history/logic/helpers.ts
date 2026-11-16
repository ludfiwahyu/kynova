import type { HistoryEntry } from '@/stores'
import { formatDay } from '@/utils'

export function groupByDay(entries: HistoryEntry[]): [day: string, entries: HistoryEntry[]][] {
    const groups = new Map<string, HistoryEntry[]>()

    for (const entry of entries) {
        const day = formatDay(entry.at)

        groups.set(day, [...(groups.get(day) ?? []), entry])
    }

    return [...groups]
}
