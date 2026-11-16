import type { CSSProperties } from 'react'

import type { useTreeRow } from '@/pages/collections/hooks/useTreeRow'
import type { ArchiveEntry, Item, Presence } from '#shared/types.ts'

export interface ItemMenuItemsProps {
    item: Item
    canEdit: boolean
    onRename: () => void
}

export interface TreeRowProps {
    item: Item
    depth: number
    visible: Set<string> | null
}

export interface WatchersProps {
    itemId: string
}

export interface TreeOrder {
    order: string[]
    openId: string | null
}

export type TreeRowState = ReturnType<typeof useTreeRow>

export interface RowStyles {
    row: CSSProperties
    group: CSSProperties
    empty: CSSProperties
}

export type WatcherList = Presence[]

export interface ArchiveRowProps {
    entry: ArchiveEntry
}
