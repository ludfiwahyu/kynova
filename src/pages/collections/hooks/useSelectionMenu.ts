import { plural } from '@/pages/collections/logic/config'
import {
    canDuplicateChosen,
    chosenItems,
    confirmDeleteChosen,
    duplicateChosen,
} from '@/pages/collections/logic/selection'
import { clearTreeSelection, useCanEdit } from '@/stores'

export function useSelectionMenu() {
    const canEdit = useCanEdit()
    const count = chosenItems().length

    const duplicateLabel = `Duplicate ${plural(count, 'request', 'requests')}`
    const deleteLabel = `Delete ${plural(count, 'item', 'items')}`

    function clear() {
        clearTreeSelection()
    }

    function remove() {
        void confirmDeleteChosen()
    }

    return {
        canEdit,
        canDuplicate: canDuplicateChosen(),
        duplicateLabel,
        deleteLabel,
        duplicate: duplicateChosen,
        remove,
        clear,
    }
}
