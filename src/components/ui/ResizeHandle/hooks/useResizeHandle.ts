import type { KeyboardEvent, PointerEvent } from 'react'
import { useRef } from 'react'

import type { ResizeHandleOptions } from '@/components/ui/ResizeHandle/types'

export function useResizeHandle({ orientation, onDrag, onDragStart, step }: ResizeHandleOptions) {
    const start = useRef(0)

    const isVertical = orientation === 'vertical'
    const grow = isVertical ? 'ArrowRight' : 'ArrowDown'
    const shrink = isVertical ? 'ArrowLeft' : 'ArrowUp'

    function pointerPosition(event: PointerEvent) {
        return isVertical ? event.clientX : event.clientY
    }

    function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
        if (event.button !== 0) {
            return
        }

        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        start.current = pointerPosition(event)
        document.body.dataset.resizing = orientation
        onDragStart()
    }

    function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
            return
        }

        onDrag(pointerPosition(event) - start.current)
    }

    function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
        event.currentTarget.releasePointerCapture(event.pointerId)
        delete document.body.dataset.resizing
    }

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        if (event.key !== grow && event.key !== shrink) {
            return
        }

        event.preventDefault()
        onDragStart()
        onDrag(event.key === grow ? step : -step)
    }

    return {
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handleKeyDown,
    }
}
