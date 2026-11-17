import type { EditorView } from '@codemirror/view'
import { type RefObject, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { VariableContext } from '@/components/ui/VariableInput/context/VariableContext'
import {
    EDGE_MARGIN,
    FLOAT_GAP,
    FLOAT_WIDTH,
    HOVER_DELAY_MS,
} from '@/components/ui/VariableInput/logic/config'
import {
    entryNamed,
    fieldEntries,
    floatingContainer,
    revealHint,
} from '@/components/ui/VariableInput/logic/helpers'
import { HOVER_CLOSE_MS } from '@/constants'
import { placeholderAt, type Variables } from '@/utils'

interface Hovered {
    name: string
    /** Where the variable starts in the text, so moving along it keeps the same card. */
    start: number
    left: number
    top: number
}

/** The `{{variable}}` under the pointer, with where it starts in the text. */
function variableAt(view: EditorView, event: MouseEvent) {
    const position = view.posAtCoords({
        x: event.clientX,
        y: event.clientY,
    })

    if (position === null) {
        return null
    }

    const line = view.state.doc.lineAt(position)
    const found = placeholderAt(line.text, position - line.from)

    return found
        ? {
              name: found.name.trim(),
              start: line.from + found.start,
          }
        : null
}

/**
 * As in the variable fields: resting the pointer on a `{{variable}}` in the editor shows its
 * value and where it comes from (editable there), and ⌘-click on a Mac, Ctrl-click on Windows,
 * opens it in the Variables panel. Only editors given `variables` do this.
 */
export function useVariableHover(
    viewRef: RefObject<EditorView | null>,
    variables: Variables | undefined,
) {
    const context = useContext(VariableContext)
    const [hovered, setHovered] = useState<Hovered | null>(null)
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
    const latest = useRef({
        hovered,
        reveal: context?.reveal,
    })

    latest.current = {
        hovered,
        reveal: context?.reveal,
    }

    const entries = useMemo(
        () => (variables ? (context?.entries ?? fieldEntries(variables)) : []),
        [context?.entries, variables],
    )

    const isOn = variables !== undefined

    useEffect(() => {
        const view = viewRef.current

        if (!view || !isOn) {
            return
        }

        const hideSoon = () => {
            clearTimeout(timer.current)
            timer.current = setTimeout(() => setHovered(null), HOVER_CLOSE_MS)
        }

        const handleMove = (event: MouseEvent) => {
            // A drag is selecting text, not reading a variable.
            if (event.buttons !== 0) {
                return
            }

            const found = variableAt(view, event)

            clearTimeout(timer.current)

            if (!found) {
                hideSoon()

                return
            }

            if (latest.current.hovered?.start === found.start) {
                return
            }

            const coords = view.coordsAtPos(found.start)

            if (!coords) {
                return
            }

            timer.current = setTimeout(
                () =>
                    setHovered({
                        ...found,
                        left: Math.max(
                            EDGE_MARGIN,
                            Math.min(coords.left, innerWidth - FLOAT_WIDTH),
                        ),
                        top: coords.bottom + FLOAT_GAP,
                    }),
                latest.current.hovered ? 0 : HOVER_DELAY_MS,
            )
        }

        // Before the editor's own handler, so the click does not also move the cursor.
        const handleDown = (event: MouseEvent) => {
            const reveal = latest.current.reveal

            if (event.button !== 0 || !(event.metaKey || event.ctrlKey) || !reveal) {
                return
            }

            const found = variableAt(view, event)

            if (!found) {
                return
            }

            event.preventDefault()
            event.stopPropagation()
            clearTimeout(timer.current)
            setHovered(null)
            reveal(found.name)
        }

        const hideNow = () => {
            clearTimeout(timer.current)
            setHovered(null)
        }

        view.contentDOM.addEventListener('mousemove', handleMove)
        view.contentDOM.addEventListener('mouseleave', hideSoon)
        view.contentDOM.addEventListener('mousedown', handleDown, true)
        view.scrollDOM.addEventListener('scroll', hideNow)

        return () => {
            clearTimeout(timer.current)
            view.contentDOM.removeEventListener('mousemove', handleMove)
            view.contentDOM.removeEventListener('mouseleave', hideSoon)
            view.contentDOM.removeEventListener('mousedown', handleDown, true)
            view.scrollDOM.removeEventListener('scroll', hideNow)
        }
    }, [viewRef, isOn])

    return {
        hovered,
        entry: hovered && variables ? entryNamed(entries, variables, hovered.name) : null,
        environmentName: context?.environmentName,
        onSave: context?.setValue,
        revealHint: context?.reveal ? revealHint() : undefined,
        container: viewRef.current ? floatingContainer(viewRef.current.dom) : document.body,
        keep: () => clearTimeout(timer.current),
        close: () => setHovered(null),
    }
}
