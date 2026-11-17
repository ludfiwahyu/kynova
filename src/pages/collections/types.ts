import type { CSSProperties, ReactNode } from 'react'

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

export interface ItemHoverLabelProps {
    item: Item
    /** A note under the address, such as what a preview tab is. */
    hint?: string
    children: ReactNode
}

/** A piece of an address in a hover label; missing ones are variables with no value. */
export interface LabelPart {
    text: string
    isMissing?: boolean
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
