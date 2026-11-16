import { isRequest } from '@/pages/collections/logic/config'
import { confirmDeleteChosen, duplicateChosen } from '@/pages/collections/logic/selection'
import { clearTreeSelection, useCanEdit, useTreeSelection, useWorkspace } from '@/stores'
import { topmostItems } from '@/utils'

export function useSelectionBar() {
    const canEdit = useCanEdit()
    const items = useWorkspace((state) => state.items)
    const ids = useTreeSelection((state) => state.ids).filter((id) => id in items)

    const chosen = topmostItems(ids, (id) => items[id]?.parentId).map((id) => items[id])
    const duplicable = chosen.every(isRequest)

    const isVisible = ids.length >= 2
    const countLabel = `${ids.length} selected`
    const duplicateTitle = duplicable ? 'Duplicate' : 'Only requests can be duplicated'

    function clear() {
        clearTreeSelection()
    }

    function remove() {
        void confirmDeleteChosen()
    }

    return {
        canEdit,
        duplicable,
        isVisible,
        countLabel,
        duplicateTitle,
        duplicate: duplicateChosen,
        remove,
        clear,
    }
}
