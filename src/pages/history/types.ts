import type { HttpMethod } from '#shared/types.ts'

export interface HistoryRow {
    id: string
    itemId: string
    method: HttpMethod
    url: string
    title: string
    disabled: boolean
    statusText: string
    tone: string
    time: string
}

export interface HistoryDay {
    day: string
    rows: HistoryRow[]
}
