import { confirm } from '@/components'
import { isRequest, plural } from '@/pages/collections/logic/config'
import { describe } from '@/pages/collections/logic/helpers'
import {
    clearTreeSelection,
    deleteItem,
    duplicateRequest,
    useTreeSelection,
    useWorkspace,
} from '@/stores'
import { topmostItems } from '@/utils'
import type { Item } from '#shared/types.ts'

export function chosenItems(): Item[] {
    const { items } = useWorkspace.getState()
    const ids = useTreeSelection.getState().ids.filter((id) => id in items)

    return topmostItems(ids, (id) => items[id]?.parentId).map((id) => items[id])
}

export function canDuplicateChosen(): boolean {
    const chosen = chosenItems()

    return chosen.length > 0 && chosen.every(isRequest)
}

export async function confirmDeleteChosen(): Promise<void> {
    const chosen = chosenItems()

    if (chosen.length === 0) {
        return
    }

    const count = plural(chosen.length, 'item', 'items')
    const verb = chosen.length === 1 ? 'is' : 'are'
    const inside = chosen.some((item) => !isRequest(item)) ? ', with everything inside' : ''

    const confirmed = await confirm({
        title: `Delete ${count}?`,
        message: `${describe(chosen)} ${verb} moved to the Archive for every member of the workspace${inside}. You can restore them from there.`,
        action: `Delete ${count}`,
    })

    if (!confirmed) {
        return
    }

    for (const item of chosen) {
        deleteItem(item.id)
    }

    clearTreeSelection()
}

export function duplicateChosen(): void {
    for (const item of chosenItems()) {
        if (isRequest(item)) {
            duplicateRequest(item)
        }
    }

    clearTreeSelection()
}
