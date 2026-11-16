import type { KeyboardEvent, MouseEvent } from 'react'
import { useId, useMemo, useRef, useState } from 'react'

import { useShortcut } from '@/hooks'
import { toSearchResults, toSearchRows } from '@/layouts/Workbench/logic/mappers'
import { expand, openTab, useWorkspace } from '@/stores'
import type { Item } from '#shared/types.ts'

export function useQuickSearch() {
    const items = useWorkspace((state) => state.items)

    const [query, setQuery] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [selected, setSelected] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const listId = useId()

    const results = useMemo(() => toSearchResults(items, query), [items, query])
    const rows = toSearchRows(results, items, listId, selected)

    const showResults = isOpen && query.trim() !== ''
    const isEmpty = results.length === 0
    const activeId = showResults && results[selected] ? `${listId}-${selected}` : undefined

    useShortcut('interface.search', () => inputRef.current?.focus())

    function choose(item: Item) {
        // Reveal it in the tree, then open it.
        let parentId = item.parentId

        while (parentId) {
            expand(parentId)
            parentId = items[parentId]?.parentId ?? null
        }

        openTab({
            kind: 'item',
            id: item.id,
        })
        setQuery('')
        inputRef.current?.blur()
    }

    function changeQuery(text: string) {
        setQuery(text)
        setSelected(0)
        setIsOpen(true)
    }

    function open() {
        setIsOpen(true)
    }

    function close() {
        setIsOpen(false)
    }

    function hover(index: number) {
        setSelected(index)
    }

    // Chosen on mouse down, before the input's blur closes the list.
    function pick(event: MouseEvent, item: Item) {
        event.preventDefault()
        choose(item)
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'ArrowDown') {
            setSelected((index) => Math.min(index + 1, results.length - 1))
        } else if (event.key === 'ArrowUp') {
            setSelected((index) => Math.max(index - 1, 0))
        } else if (event.key === 'Enter' && results[selected]) {
            choose(results[selected])
        } else if (event.key === 'Escape') {
            inputRef.current?.blur()
        } else {
            return
        }

        event.preventDefault()
    }

    return {
        inputRef,
        listId,
        query,
        rows,
        showResults,
        isEmpty,
        activeId,
        changeQuery,
        open,
        close,
        hover,
        pick,
        handleKeyDown,
    }
}
