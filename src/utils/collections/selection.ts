/** Adds `id`, or takes it out when it is already chosen. */
export function toggleInSelection(selection: string[], id: string): string[] {
    return selection.includes(id) ? selection.filter((chosen) => chosen !== id) : [...selection, id]
}

/** Every row from `anchor` to `to`, both included, in screen order. Just `to` without an anchor. */
export function rangeSelection(order: string[], anchor: string | null, to: string): string[] {
    const from = anchor ? order.indexOf(anchor) : -1
    const end = order.indexOf(to)

    if (from === -1 || end === -1) {
        return [to]
    }

    return order.slice(Math.min(from, end), Math.max(from, end) + 1)
}

/**
 * The chosen items that are not inside another chosen one: deleting a folder already
 * deletes what is in it, and duplicating both would copy the inside twice.
 */
export function topmostItems(
    ids: string[],
    parentOf: (id: string) => string | null | undefined,
): string[] {
    const chosen = new Set(ids)

    return ids.filter((id) => {
        for (let parent = parentOf(id); parent; parent = parentOf(parent)) {
            if (chosen.has(parent)) {
                return false
            }
        }

        return true
    })
}
