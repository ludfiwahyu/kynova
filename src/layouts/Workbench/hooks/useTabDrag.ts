import type { PointerEvent as ReactPointerEvent } from 'react'

import { placeDragged } from '@/layouts/Workbench/hooks/useTabLayout'
import { DRAG_THRESHOLD } from '@/layouts/Workbench/logic/config'
import { tabKey } from '@/layouts/Workbench/logic/helpers'
import type { TabLayout } from '@/layouts/Workbench/types'
import { keepTab, moveTab, type Tab, useUi } from '@/stores'
import { glide } from '@/utils'

/** Dragging a tab along the strip reorders it; a press without moving is a click. */
export function useTabDrag(layout: TabLayout) {
    const { stripRef, elements, lastLeft, drag } = layout

    function startDrag(event: ReactPointerEvent<HTMLDivElement>, tab: Tab) {
        if (event.button !== 0 || (event.target as Element).closest('.doc-tab-close')) {
            return
        }

        const key = tabKey(tab)
        const element = event.currentTarget
        const startX = event.clientX
        const grab = event.clientX - element.getBoundingClientRect().left
        let moved = false

        const onMove = (move: PointerEvent) => {
            if (!moved && Math.abs(move.clientX - startX) < DRAG_THRESHOLD) {
                return
            }

            if (!moved) {
                moved = true
                element.dataset.dragging = 'true'
                // Placing a preview tab is choosing to keep it.
                keepTab(tab)
            }

            drag.current = {
                key,
                screenLeft: move.clientX - grab,
            }

            // The order where the dragged tab's middle has passed the others' middles.
            const middle = move.clientX - grab + element.offsetWidth / 2
            const strip = stripRef.current!
            const stripLeft = strip.getBoundingClientRect().left - strip.scrollLeft
            const order = useUi.getState().tabs
            const others = order.filter((open) => tabKey(open) !== key)
            const index = others.filter((open) => {
                const other = elements.current.get(tabKey(open))

                return other && stripLeft + other.offsetLeft + other.offsetWidth / 2 < middle
            }).length

            if (index !== order.findIndex((open) => tabKey(open) === key)) {
                moveTab(tab, index)
            }

            placeDragged(layout)
        }

        const onUp = () => {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
            window.removeEventListener('pointercancel', onUp)

            if (!moved) {
                return
            }

            // Settles into its place, and the click that ends a drag does not open it again.
            const shift = new DOMMatrix(getComputedStyle(element).transform).m41

            element.style.transform = ''
            delete element.dataset.dragging
            drag.current = null
            lastLeft.current.set(key, element.offsetLeft)
            glide(element, shift)

            // Only the click that ends this drag, if the browser sends one: right away.
            const swallow = (click: MouseEvent) => click.stopPropagation()

            window.addEventListener('click', swallow, {
                capture: true,
                once: true,
            })
            setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0)
        }

        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
        window.addEventListener('pointercancel', onUp)
    }

    return startDrag
}
