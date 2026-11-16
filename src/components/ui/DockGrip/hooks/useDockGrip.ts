import type { MouseEvent, PointerEvent } from 'react'
import { useEffect, useRef, useState } from 'react'

import { DRAG_THRESHOLD } from '@/components/ui/DockGrip/logic/config'
import { nearestDock } from '@/components/ui/DockGrip/logic/helpers'
import { toDockPlaces } from '@/components/ui/DockGrip/logic/mappers'
import type { DockDrag, DockGripProps } from '@/components/ui/DockGrip/types'
import type { Dock } from '@/stores'
import { flipLayout } from '@/utils'

interface Press {
    x: number
    y: number
}

export function useDockGrip({ name, dock, onDock, area, labels }: DockGripProps) {
    const [drag, setDrag] = useState<DockDrag | null>(null)
    const press = useRef<Press | null>(null)

    // A drag ends in a click on the grip; that click must not open the menu.
    const swallowClick = useRef(false)

    const isDragging = drag !== null

    useEffect(() => {
        if (!isDragging) {
            return
        }

        document.body.dataset.docking = ''

        function onKeyDown(event: KeyboardEvent) {
            if (event.key !== 'Escape') {
                return
            }

            event.preventDefault()
            press.current = null
            swallowClick.current = true
            setDrag(null)
        }

        window.addEventListener('keydown', onKeyDown, true)

        return () => {
            delete document.body.dataset.docking
            window.removeEventListener('keydown', onKeyDown, true)
        }
    }, [isDragging])

    function handleClick(event: MouseEvent<HTMLButtonElement>, open: (event: MouseEvent) => void) {
        if (swallowClick.current) {
            swallowClick.current = false

            return
        }

        open(event)
    }

    function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
        if (event.button !== 0) {
            return
        }

        swallowClick.current = false
        press.current = {
            x: event.clientX,
            y: event.clientY,
        }
        event.currentTarget.setPointerCapture(event.pointerId)
    }

    function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
        const start = press.current

        if (!start) {
            return
        }

        let rect = drag?.rect

        if (!rect) {
            const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y)

            if (moved < DRAG_THRESHOLD) {
                return
            }

            rect = area()?.getBoundingClientRect()

            if (!rect) {
                return
            }
        }

        const zone = nearestDock(rect, event.clientX, event.clientY)

        if (zone !== drag?.zone || rect !== drag.rect) {
            setDrag({
                rect,
                zone,
            })
        }
    }

    function handlePointerUp() {
        press.current = null

        if (!drag) {
            return
        }

        swallowClick.current = true
        setDrag(null)

        if (drag.zone !== dock) {
            flipLayout(() => onDock(drag.zone))
        }
    }

    function handlePointerCancel() {
        press.current = null
        setDrag(null)
    }

    return {
        drag,
        label: `Move ${name}`,
        places: toDockPlaces(dock, labels),
        zoneLabel: drag ? labels[drag.zone] : '',
        handleClick,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handlePointerCancel,
        onDock: (place: Dock) => flipLayout(() => onDock(place)),
    }
}
