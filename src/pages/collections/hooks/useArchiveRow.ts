import { confirm } from '@/components'
import type { ArchiveRowProps } from '@/pages/collections/types'
import { deleteArchived, restoreArchived, useCanEdit } from '@/stores'
import { formatWhen } from '@/utils'

export function useArchiveRow({ entry }: ArchiveRowProps) {
    const canEdit = useCanEdit()
    const inside = entry.items.length - 1

    const meta = `${entry.deletedBy} · ${formatWhen(entry.deletedAt)}`
    const title = inside > 0 ? `${entry.name}, with ${inside} inside` : entry.name

    async function removeForGood() {
        const confirmed = await confirm({
            title: `Delete ${entry.name} for good?`,
            message:
                'It is gone for every member of the workspace, with what it holds and its saved versions. This cannot be undone.',
            action: 'Delete for good',
        })

        if (confirmed) {
            deleteArchived(entry.id)
        }
    }

    return {
        canEdit,
        meta,
        title,
        root: entry.items[0],
        restore: () => restoreArchived(entry.id),
        removeForGood,
    }
}
