import { type RefObject, useLayoutEffect, useRef } from 'react'

import { GLIDE_SECONDS } from '@/pages/collections/logic/config'
import { glide } from '@/utils'

export function useRowGlide(treeRef: RefObject<HTMLDivElement | null>, dependencies: unknown[]) {
    const rowTops = useRef(new Map<string, number>())

    useLayoutEffect(() => {
        const rows = treeRef.current?.querySelectorAll<HTMLElement>('.tree-row') ?? []
        const next = new Map<string, number>()

        for (const row of rows) {
            const top = row.offsetTop
            const id = row.dataset.itemId!
            const before = rowTops.current.get(id)

            next.set(id, top)

            if (before !== undefined && before !== top) {
                glide(row, 0, before - top, GLIDE_SECONDS)
            }
        }

        rowTops.current = next
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies)
}
