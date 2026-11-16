import { create } from 'zustand'

import { rangeSelection, toggleInSelection } from '@/utils'

/**
 * The rows chosen in the collection tree with ⌘ or Ctrl and Shift, for acting on several
 * at once. Empty when only the open item is highlighted, the usual case. Not kept across
 * reloads.
 */
export const useTreeSelection = create<{
    ids: string[]
    anchor: string | null
}>()(() => ({
    ids: [],
    anchor: null,
}))

/** ⌘ or Ctrl click: adds or removes `id`. The open item joins the first time, as in Finder. */
export function toggleTreeSelection(id: string, openId: string | null): void {
    const { ids } = useTreeSelection.getState()
    const start = ids.length === 0 && openId && openId !== id ? [openId] : ids

    useTreeSelection.setState({
        ids: toggleInSelection(start, id),
        anchor: id,
    })
}

/** Shift click: every row from the last one clicked (or the open one) to `id`. */
export function selectTreeRange(id: string, order: string[], openId: string | null): void {
    const { anchor } = useTreeSelection.getState()

    useTreeSelection.setState({
        ids: rangeSelection(order, anchor ?? openId, id),
        anchor: anchor ?? openId ?? id,
    })
}

/** A plain click: nothing chosen any more; this row is where a later Shift click starts. */
export function clearTreeSelection(anchor: string | null = null): void {
    useTreeSelection.setState({
        ids: [],
        anchor,
    })
}

/** The rows being dragged in the tree, and where they would land now. */
export const useTreeDrag = create<{
    ids: string[]
    /** The rows just dropped, lit like a hovered row until the pointer moves again. */
    landed: string[]
    over: {
        id: string
        zone: 'before' | 'after' | 'inside'
    } | null
}>()(() => ({
    ids: [],
    landed: [],
    over: null,
}))
