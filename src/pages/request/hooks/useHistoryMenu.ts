import { useEffect, useState } from 'react'

import type { HistoryMenuProps } from '@/pages/request/types'
import { requestVersions, useVersions } from '@/stores'
import { formatWhen } from '@/utils'
import type { RequestVersion } from '#shared/types.ts'

/** The history list: fetched each time it opens, so it always shows the latest saves. */
export function useVersionList({ item }: HistoryMenuProps) {
    const versions = useVersions((state) => state.byItem[item.id])

    useEffect(() => {
        requestVersions(item.id)
    }, [item.id])

    return {
        isLoading: versions === undefined,
        isEmpty: versions?.length === 0,
        rows: (versions ?? []).map((version, index) => ({
            version,
            who: version.savedBy,
            when: formatWhen(version.savedAt),
            isCurrent: index === 0,
        })),
    }
}

export function useHistoryMenu() {
    const [open, setOpen] = useState<RequestVersion | null>(null)

    return {
        open,
        show: setOpen,
        close: () => setOpen(null),
    }
}
