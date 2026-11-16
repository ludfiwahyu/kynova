import { DELETED_TITLE, ERROR_STATUS_TEXT } from '@/pages/history/logic/config'
import { groupByDay } from '@/pages/history/logic/helpers'
import type { HistoryDay, HistoryRow } from '@/pages/history/types'
import type { HistoryEntry } from '@/stores'
import { formatTime, type ItemsById, statusTone } from '@/utils'

function toHistoryRow(entry: HistoryEntry, items: ItemsById): HistoryRow {
    const stillExists = entry.itemId in items

    return {
        id: entry.id,
        itemId: entry.itemId,
        method: entry.method,
        url: entry.url,
        title: stillExists ? entry.url : DELETED_TITLE,
        disabled: !stillExists,
        statusText: entry.status === null ? ERROR_STATUS_TEXT : String(entry.status),
        tone: statusTone(entry.status),
        time: formatTime(entry.at),
    }
}

export function toHistoryDays(entries: HistoryEntry[], items: ItemsById): HistoryDay[] {
    return groupByDay(entries).map(([day, dayEntries]) => ({
        day,
        rows: dayEntries.map((entry) => toHistoryRow(entry, items)),
    }))
}
