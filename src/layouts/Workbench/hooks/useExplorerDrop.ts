import type { DragEvent } from 'react'
import { useState } from 'react'

import { openTab, useTreeDrag, useWorkspace } from '@/stores'

/** Opens the rows dragged from the sidebar as tabs, from `at` on; the first becomes active. */
function openDragged(at: number | undefined) {
    const { ids } = useTreeDrag.getState()
    const { items } = useWorkspace.getState()

    ids.filter((id) => items[id]).forEach((id, index) => {
        openTab(
            {
                kind: 'item',
                id,
            },
            {
                at: at === undefined ? undefined : at + index,
                background: index > 0,
            },
        )
    })
}

const isExplorerDrag = () => useTreeDrag.getState().ids.length > 0

/**
 * Makes an area take rows dragged from the sidebar and open them as permanent tabs.
 * `indexAt` turns the pointer into a place in the tab strip; without it tabs go at the end.
 */
export function useExplorerDrop(indexAt?: (clientX: number) => number) {
    const isDragging = useTreeDrag((state) => state.ids.length > 0)
    const [isOver, setOver] = useState(false)
    const [dropIndex, setDropIndex] = useState<number | null>(null)

    function reset() {
        setOver(false)
        setDropIndex(null)
    }

    function dragOver(event: DragEvent<HTMLElement>) {
        if (!isExplorerDrag()) {
            return
        }

        // Before the editors and fields inside, which would take the dragged names as text.
        event.preventDefault()
        event.stopPropagation()
        event.dataTransfer.dropEffect = 'copy'
        setOver(true)

        if (indexAt) {
            setDropIndex(indexAt(event.clientX))
        }
    }

    function dragLeave(event: DragEvent<HTMLElement>) {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            reset()
        }
    }

    function drop(event: DragEvent<HTMLElement>) {
        if (!isExplorerDrag()) {
            return
        }

        event.preventDefault()
        event.stopPropagation()
        reset()
        openDragged(indexAt?.(event.clientX))
    }

    return {
        isOver: isOver && isDragging,
        dropIndex: isDragging ? dropIndex : null,
        dragOver,
        dragLeave,
        drop,
    }
}
