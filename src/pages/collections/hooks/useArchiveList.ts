import { useCanEdit, useWorkspace } from '@/stores'

export function useArchiveList() {
    const archive = useWorkspace((state) => state.archive)
    const canEdit = useCanEdit()

    const entries = Object.values(archive).sort((a, b) => b.deletedAt - a.deletedAt)

    return {
        entries,
        isEmpty: entries.length === 0,
        canEdit,
    }
}
