import type { DragEvent } from 'react'
import { useRef } from 'react'

import { FOLDER_OPEN_MS } from '@/constants'
import { zoneAt } from '@/pages/collections/logic/helpers'
import { treeOrder } from '@/pages/collections/logic/tree'
import {
    clearTreeSelection,
    expand,
    saveItems,
    useTreeDrag,
    useTreeSelection,
    useWorkspace,
} from '@/stores'
import { dropPlacement, moveItems, topmostItems } from '@/utils'
import { MIME } from '#shared/http.ts'
import type { Item } from '#shared/types.ts'

interface RowDragOptions {
    item: Item
    isChosen: boolean
    isCollapsed: boolean
    isContainer: boolean
    canEdit: boolean
}

/** Lights the dropped rows until the pointer moves: the browser keeps :hover on the slot the drag left. */
function landIn(ids: string[]) {
    useTreeDrag.setState({ landed: ids })
    window.addEventListener('pointermove', () => useTreeDrag.setState({ landed: [] }), {
        once: true,
    })
}

export function useRowDrag({ item, isChosen, isCollapsed, isContainer, canEdit }: RowDragOptions) {
    const expandTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

    function stopTimer() {
        clearTimeout(expandTimer.current)
        expandTimer.current = undefined
    }

    function dragStart(event: DragEvent<HTMLDivElement>) {
        const { items } = useWorkspace.getState()
        const chosen = useTreeSelection.getState().ids
        const { order } = treeOrder(event.currentTarget)

        // Dragging one of several chosen rows moves them all, top to bottom as they show.
        const ids =
            isChosen && chosen.length > 1
                ? topmostItems(
                      order.filter((id) => chosen.includes(id)),
                      (id) => items[id]?.parentId,
                  )
                : [item.id]

        useTreeDrag.setState({
            ids,
            over: null,
            landed: [],
        })

        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData(MIME.text, ids.map((id) => items[id]?.name).join('\n'))
    }

    function dragOver(event: DragEvent<HTMLDivElement>) {
        const { ids } = useTreeDrag.getState()

        if (ids.length === 0) {
            return
        }

        const { items } = useWorkspace.getState()
        const dragsCollections = ids.some((id) => items[id]?.kind === 'collection')

        // A collection takes requests and folders anywhere over it.
        const zone =
            item.kind === 'collection' && !dragsCollections ? 'inside' : zoneAt(event, item)

        if (!dropPlacement(items, ids, item.id, zone)) {
            return
        }

        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'

        const { over } = useTreeDrag.getState()

        if (over?.id !== item.id || over.zone !== zone) {
            useTreeDrag.setState({
                over: {
                    id: item.id,
                    zone,
                },
            })
        }

        // Resting on a closed folder opens it, to drop deeper.
        if (zone === 'inside' && isCollapsed && isContainer && !expandTimer.current) {
            expandTimer.current = setTimeout(() => expand(item.id), FOLDER_OPEN_MS)
        }
    }

    function dragLeave(event: DragEvent<HTMLDivElement>) {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
            return
        }

        stopTimer()

        const { over } = useTreeDrag.getState()

        if (over?.id === item.id) {
            useTreeDrag.setState({ over: null })
        }
    }

    function drop(event: DragEvent<HTMLDivElement>) {
        event.preventDefault()
        stopTimer()

        const { ids, over } = useTreeDrag.getState()

        useTreeDrag.setState({
            ids: [],
            over: null,
        })

        if (!over || !canEdit) {
            return
        }

        const { items } = useWorkspace.getState()
        const placement = dropPlacement(items, ids, item.id, over.zone)

        if (!placement) {
            return
        }

        const moved = moveItems(items, ids, placement)

        if (moved.length > 0) {
            saveItems(moved)
            landIn(ids)
        }

        if (placement.parentId) {
            expand(placement.parentId)
        }

        clearTreeSelection()
    }

    function dragEnd() {
        useTreeDrag.setState({
            ids: [],
            over: null,
        })
    }

    return {
        dragStart,
        dragOver,
        dragLeave,
        drop,
        dragEnd,
    }
}
