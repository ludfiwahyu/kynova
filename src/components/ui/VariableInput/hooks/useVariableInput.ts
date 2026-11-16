import {
    type KeyboardEvent,
    useContext,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react'

import { VariableContext } from '@/components/ui/VariableInput/context/VariableContext'
import {
    EMPTY_TEXT,
    HOVER_DELAY_MS,
    LIST_MOVES,
    MAX_SUGGESTIONS,
    ROW_ACTIVE,
    ROW_CLASS,
    ROW_IDLE,
} from '@/components/ui/VariableInput/logic/config'
import {
    entryNamed,
    fieldEntries,
    indexAt,
    splitParts,
} from '@/components/ui/VariableInput/logic/helpers'
import type { Hovered, Suggesting, VariableInputOptions } from '@/components/ui/VariableInput/types'
import { classNames } from '@/components/utils/helpers'
import { HOVER_CLOSE_MS } from '@/constants'
import {
    insertVariable,
    matchVariables,
    placeholderAt,
    type VariableEntry,
    variableQuery,
} from '@/utils'

export function useVariableInput({
    value,
    onChange,
    variables,
    onKeyDown,
    onBlur,
}: VariableInputOptions) {
    const inputRef = useRef<HTMLInputElement>(null)
    const mirrorRef = useRef<HTMLDivElement>(null)
    const listId = useId()
    const context = useContext(VariableContext)

    const [suggesting, setSuggesting] = useState<Suggesting | null>(null)
    const [hovered, setHovered] = useState<Hovered | null>(null)
    const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
    const caretAfterChange = useRef<number | null>(null)

    const entries = useMemo<VariableEntry[]>(
        () => context?.entries ?? fieldEntries(variables),
        [context?.entries, variables],
    )

    const matches = suggesting
        ? matchVariables(entries, suggesting.query).slice(0, MAX_SUGGESTIONS)
        : []
    const isListOpen = suggesting !== null && matches.length > 0

    const suggestions = matches.map((entry, index) => {
        const isActive = index === suggesting?.active

        return {
            entry,
            id: `${listId}-${index}`,
            key: `${entry.scope}-${entry.name}`,
            isActive,
            className: classNames(ROW_CLASS, isActive ? ROW_ACTIVE : ROW_IDLE),
            valueText: entry.value || (entry.scope === 'dynamic' ? '' : EMPTY_TEXT),
        }
    })

    const parts = splitParts(value, variables)
    const hoveredEntry = entryNamed(entries, variables, hovered?.name)
    const activeId = isListOpen ? `${listId}-${suggesting.active}` : undefined

    function syncScroll() {
        if (mirrorRef.current && inputRef.current) {
            mirrorRef.current.scrollLeft = inputRef.current.scrollLeft
        }
    }

    useLayoutEffect(syncScroll, [value])

    // After a suggestion goes in, the caret goes after it.
    useLayoutEffect(() => {
        if (caretAfterChange.current === null || !inputRef.current) {
            return
        }

        inputRef.current.setSelectionRange(caretAfterChange.current, caretAfterChange.current)
        caretAfterChange.current = null
        syncScroll()
    }, [value])

    /** Opens, narrows or closes the list for where the caret is now. */
    function updateSuggestions(text: string, caret: number | null) {
        const query = caret === null ? null : variableQuery(text, caret)

        setSuggesting(
            query
                ? {
                      ...query,
                      caret: caret!,
                      active: 0,
                  }
                : null,
        )

        if (query) {
            setHovered(null)
        }
    }

    function choose(entry: VariableEntry) {
        if (!suggesting) {
            return
        }

        const next = insertVariable(value, suggesting.start, suggesting.caret, entry.name)

        caretAfterChange.current = next.caret
        setSuggesting(null)
        onChange(next.text)
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (isListOpen) {
            const move = LIST_MOVES[event.key]

            if (move) {
                event.preventDefault()
                setSuggesting({
                    ...suggesting,
                    active: (suggesting.active + move + matches.length) % matches.length,
                })

                return
            }

            // Enter puts the variable in; it must not also send the request.
            if (event.key === 'Enter' || event.key === 'Tab') {
                event.preventDefault()
                event.stopPropagation()
                choose(matches[suggesting.active])

                return
            }

            if (event.key === 'Escape') {
                event.preventDefault()
                event.stopPropagation()
                setSuggesting(null)

                return
            }
        }

        onKeyDown?.(event)
    }

    function hideSoon() {
        clearTimeout(hoverTimer.current)
        hoverTimer.current = setTimeout(() => setHovered(null), HOVER_CLOSE_MS)
    }

    function handlePointerMove(clientX: number) {
        const input = inputRef.current

        if (!input || isListOpen) {
            return
        }

        const found = placeholderAt(value, indexAt(input, clientX))

        clearTimeout(hoverTimer.current)

        if (!found) {
            // A short grace, so the pointer can travel down into the details.
            hideSoon()

            return
        }

        if (hovered?.start === found.start) {
            return
        }

        hoverTimer.current = setTimeout(
            () =>
                setHovered({
                    start: found.start,
                    name: found.name.trim(),
                }),
            hovered ? 0 : HOVER_DELAY_MS,
        )
    }

    function handleChange(text: string, caret: number | null) {
        onChange(text)
        updateSuggestions(text, caret)
    }

    function handleBlur(event: Parameters<NonNullable<typeof onBlur>>[0]) {
        setSuggesting(null)
        onBlur?.(event)
    }

    function handleSelect(input: HTMLInputElement) {
        syncScroll()

        // Moving the caret out of an unfinished `{{` closes the list.
        if (suggesting) {
            updateSuggestions(input.value, input.selectionStart)
        }
    }

    return {
        inputRef,
        mirrorRef,
        listId,
        activeId,
        parts,
        suggesting,
        suggestions,
        isListOpen,
        hovered,
        hoveredEntry,
        context,
        input: inputRef.current,
        syncScroll,
        choose,
        handleKeyDown,
        handlePointerMove,
        handleChange,
        handleBlur,
        handleSelect,
        hideSoon,
        keepHover: () => clearTimeout(hoverTimer.current),
        closeHover: () => setHovered(null),
    }
}
