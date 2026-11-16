import type { CSSProperties, DragEvent } from 'react'

import { confirm } from '@/components'
import { isContainer, isRequest, KIND_LABEL, plural } from '@/pages/collections/logic/config'
import { deleteItem, editNameSoon, expand, openTab } from '@/stores'
import type { DropZone, ItemsById } from '@/utils'
import type { Item } from '#shared/types.ts'

/** The items whose name or URL matches, and every container above them. */
export function visibleIds(items: ItemsById, filter: string): Set<string> | null {
    const needle = filter.trim().toLowerCase()

    if (!needle) {
        return null
    }

    const visible = new Set<string>()
    const text = (item: Item) => `${item.name} ${urlOf(item)}`.toLowerCase()

    for (const item of Object.values(items)) {
        if (!text(item).includes(needle)) {
            continue
        }

        for (
            let current: Item | undefined = item;
            current;
            current = current.parentId ? items[current.parentId] : undefined
        ) {
            visible.add(current.id)
        }
    }

    return visible
}

/** Whether a row has any action for this user: viewers can only export collections. */
export function hasActions(item: Item, canEdit: boolean): boolean {
    return canEdit || item.kind === 'collection'
}

export async function confirmDelete(item: Item): Promise<void> {
    const kind = KIND_LABEL[item.kind]
    const confirmed = await confirm({
        title: `Delete ${item.name}?`,
        message: isContainer(item)
            ? `It moves to the Archive with everything inside it, for every member of the workspace. You can restore it from there.`
            : 'It moves to the Archive for every member of the workspace. You can restore it from there.',
        action: `Delete ${kind}`,
    })

    if (confirmed) {
        deleteItem(item.id)
    }
}

/** Adds a child to a container, reveals it, and opens it when it is a request. */
export function addChild(parent: Item, create: (parentId: string) => Item): void {
    const created = create(parent.id)

    expand(parent.id)
    editNameSoon(created.id)

    if (created.kind !== 'folder') {
        openTab({
            kind: 'item',
            id: created.id,
        })
    }
}

/** "2 requests and 1 folder", for the delete question. */
export function describe(chosen: Item[]): string {
    const counts = [
        [chosen.filter(isRequest).length, 'request', 'requests'],
        [chosen.filter((item) => item.kind === 'folder').length, 'folder', 'folders'],
        [chosen.filter((item) => item.kind === 'collection').length, 'collection', 'collections'],
    ] as const

    const parts = counts
        .filter(([count]) => count > 0)
        .map(([count, one, many]) => plural(count, one, many))

    return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0]
}

/** The rows of the tree `row` is in, top to bottom, as they show. */
export function visibleRows(row: HTMLElement): HTMLElement[] {
    return [...(row.closest('[role="tree"]')?.querySelectorAll<HTMLElement>('.tree-row') ?? [])]
}

/** Moves keyboard focus to the previous or next visible row, and returns it. */
export function focusSiblingRow(row: HTMLElement, step: 1 | -1): HTMLElement | undefined {
    const rows = visibleRows(row)
    const sibling = rows[rows.indexOf(row) + step]

    sibling?.focus()

    return sibling
}

function urlOf(item: Item): string {
    if (item.kind === 'http') {
        return item.request.url
    }

    return item.kind === 'websocket' ? item.url : ''
}

/** Which part of the row the pointer is over: the edges insert, the middle of a folder goes in. */
export function zoneAt(event: DragEvent<HTMLElement>, item: Item): DropZone {
    const rect = event.currentTarget.getBoundingClientRect()
    const y = (event.clientY - rect.top) / rect.height

    if (item.kind === 'folder') {
        if (y < 0.25) {
            return 'before'
        }

        return y > 0.75 ? 'after' : 'inside'
    }

    return y < 0.5 ? 'before' : 'after'
}

export function depthStyle(depth: number): CSSProperties {
    return { '--depth': depth } as CSSProperties
}
