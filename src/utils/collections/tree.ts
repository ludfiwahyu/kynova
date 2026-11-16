import type { CollectionItem, Item } from '#shared/types.ts'

export type ItemsById = Record<string, Item>

/** Direct children of `parentId` (or the collections, for `null`), in display order. */
export function childrenOf(items: ItemsById, parentId: string | null): Item[] {
    return Object.values(items)
        .filter((item) => item.parentId === parentId)
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
}

/** The `order` that places a new item after its future siblings. */
export function nextOrder(items: ItemsById, parentId: string | null): number {
    const orders = childrenOf(items, parentId).map((item) => item.order)

    return Math.max(-1, ...orders) + 1
}

/** Names from the collection down to the item's parent, for breadcrumbs. */
export function ancestorNames(items: ItemsById, item: Item): string[] {
    const parent = item.parentId ? items[item.parentId] : undefined

    return parent ? [...ancestorNames(items, parent), parent.name] : []
}

/** The collection an item belongs to: the top of its branch. */
export function rootCollection(items: ItemsById, item: Item): CollectionItem | undefined {
    let current: Item | undefined = item

    while (current?.parentId) {
        current = items[current.parentId]
    }

    return current?.kind === 'collection' ? current : undefined
}

// ── Moving items by dragging them in the tree ───────────────────────────

/** Where a dragged item lands, relative to the row it is dropped on. */
export type DropZone = 'before' | 'after' | 'inside'

/**
 * Where `dragged` would go if dropped on `targetId` at `zone`: the new parent, and the
 * position among its other children. Null when that drop is not allowed: a collection
 * stays at the top level, nothing goes inside a request, and a folder never goes inside
 * itself.
 */
export function dropPlacement(
    items: ItemsById,
    dragged: string[],
    targetId: string,
    zone: DropZone,
): {
    parentId: string | null
    index: number
} | null {
    const target = items[targetId]

    if (!target || dragged.length === 0 || dragged.includes(targetId)) {
        return null
    }

    if (dragged.some((id) => !items[id])) {
        return null
    }

    const collections = dragged.filter((id) => items[id].kind === 'collection')

    if (collections.length > 0 && collections.length < dragged.length) {
        return null
    }

    const movingCollections = collections.length > 0

    let parentId: string | null

    if (zone === 'inside') {
        if (movingCollections || (target.kind !== 'folder' && target.kind !== 'collection')) {
            return null
        }

        parentId = target.id
    } else {
        // Collections sit side by side at the top; everything else goes next to its sibling.
        if (movingCollections !== (target.kind === 'collection')) {
            return null
        }

        parentId = target.parentId
    }

    // Not into itself or into anything inside it.
    for (let ancestor = parentId; ancestor; ancestor = items[ancestor]?.parentId ?? null) {
        if (dragged.includes(ancestor)) {
            return null
        }
    }

    const siblings = childrenOf(items, parentId).filter((item) => !dragged.includes(item.id))
    const index =
        zone === 'inside'
            ? siblings.length
            : siblings.findIndex((item) => item.id === targetId) + (zone === 'after' ? 1 : 0)

    return {
        parentId,
        index,
    }
}

/**
 * The items to save after moving `dragged` (in the order given) to `placement`: the moved
 * ones under their new parent, and their new siblings renumbered so the order holds.
 */
export function moveItems(
    items: ItemsById,
    dragged: string[],
    placement: {
        parentId: string | null
        index: number
    },
): Item[] {
    const siblings = childrenOf(items, placement.parentId).filter(
        (item) => !dragged.includes(item.id),
    )

    siblings.splice(placement.index, 0, ...dragged.map((id) => items[id]))

    return siblings
        .map(
            (item, order) =>
                ({
                    ...item,
                    parentId: placement.parentId,
                    order,
                }) as Item,
        )
        .filter((item) => {
            const before = items[item.id]

            return before.parentId !== item.parentId || before.order !== item.order
        })
}
