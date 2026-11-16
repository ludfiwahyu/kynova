import type { UIEvent } from 'react'
import { useLayoutEffect, useRef, useState } from 'react'

import { AT_BOTTOM_PX } from '@/layouts/Workbench/logic/config'
import { toConsoleRows } from '@/layouts/Workbench/logic/mappers'
import type { ConsoleViewProps } from '@/layouts/Workbench/types'
import { isProblem, useConsole } from '@/stores'

export function useConsoleView({ filter }: ConsoleViewProps) {
    const entries = useConsole((state) => state.entries)

    const [open, setOpen] = useState<Record<string, boolean>>({})
    const listRef = useRef<HTMLDivElement>(null)
    const atBottom = useRef(true)

    const shown = filter === 'all' ? entries : entries.filter(isProblem)
    const rows = toConsoleRows(shown)
    const hasEntries = entries.length > 0

    const emptyTitle = hasEntries ? 'No errors' : 'No logs yet'
    const emptyText = hasEntries
        ? 'Every logged request got a response under 400.'
        : 'Send a request to see its details here.'

    // New entries arrive at the bottom; follow them unless the reader has scrolled up.
    useLayoutEffect(() => {
        const list = listRef.current

        if (list && atBottom.current) {
            list.scrollTop = list.scrollHeight
        }
    }, [shown.length])

    function handleScroll(event: UIEvent<HTMLDivElement>) {
        const list = event.currentTarget

        atBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < AT_BOTTOM_PX
    }

    function isOpen(id: string) {
        return Boolean(open[id])
    }

    function toggle(id: string) {
        setOpen({
            ...open,
            [id]: !open[id],
        })
    }

    return {
        rows,
        listRef,
        isEmpty: rows.length === 0,
        emptyTitle,
        emptyText,
        handleScroll,
        isOpen,
        toggle,
    }
}
