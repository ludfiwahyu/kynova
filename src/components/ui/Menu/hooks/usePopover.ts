import {
    type KeyboardEvent,
    type MouseEvent,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
} from 'react'

import {
    FADE_IN,
    FADE_OUT,
    ITEM_SELECTOR,
    MARGIN,
    MAX_HEIGHT,
    MOVES,
} from '@/components/ui/Menu/logic/config'
import { focusItem, placeMenu } from '@/components/ui/Menu/logic/helpers'
import type { PopoverOptions } from '@/components/ui/Menu/types'
import { enter, leave } from '@/utils'

export function usePopover({ anchor, align, onClose, minWidth, opener }: PopoverOptions) {
    const ref = useRef<HTMLDivElement>(null)
    const isLeaving = useRef(false)

    // Positioned before the first paint, so the menu never flashes in the wrong place.
    useLayoutEffect(() => {
        const menu = ref.current

        if (!menu) {
            return
        }

        menu.style.maxHeight = `${Math.min(innerHeight - MARGIN * 2, MAX_HEIGHT)}px`

        if (minWidth) {
            menu.style.minWidth = `${minWidth}px`
        }

        const { left, top } = placeMenu(anchor, menu.offsetWidth, menu.offsetHeight, align)

        menu.style.left = `${left}px`
        menu.style.top = `${top}px`
        menu.style.visibility = 'visible'
        enter(menu, FADE_IN)

        // A list opens on its chosen option, a menu on its first item.
        const chosen = menu.querySelector<HTMLElement>('[aria-selected="true"]')

        if (chosen) {
            chosen.focus()
            chosen.scrollIntoView({ block: 'nearest' })
        } else {
            focusItem(menu, () => 0)
        }
    }, [anchor, align, minWidth])

    // Fades out, then tells the parent to remove it. Once is enough.
    const close = useCallback(() => {
        if (isLeaving.current) {
            return
        }

        isLeaving.current = true
        const menu = ref.current

        if (!menu) {
            onClose()

            return
        }

        // On its way out it is no longer a menu: screen readers, and the next menu, ignore it.
        menu.inert = true
        menu.setAttribute('aria-hidden', 'true')
        void leave(menu, FADE_OUT).then(onClose)
    }, [onClose])

    useEffect(() => {
        function onPointerDown(event: PointerEvent) {
            if (!ref.current?.contains(event.target as Node)) {
                close()
            }
        }

        // Scrolling inside the menu is fine; scrolling anything else moves the anchor away. A scroll
        // that left the opener where it was (one still settling as the menu opened, such as trackpad
        // momentum or a field scrolled into view) changes nothing.
        function onScroll(event: Event) {
            if (ref.current?.contains(event.target as Node)) {
                return
            }

            const rect = opener?.getBoundingClientRect()

            if (
                rect &&
                Math.abs(rect.top - anchor.top) < 1 &&
                Math.abs(rect.left - anchor.left) < 1
            ) {
                return
            }

            close()
        }

        document.addEventListener('pointerdown', onPointerDown, true)
        document.addEventListener('scroll', onScroll, true)
        window.addEventListener('resize', close)
        window.addEventListener('blur', close)

        return () => {
            document.removeEventListener('pointerdown', onPointerDown, true)
            document.removeEventListener('scroll', onScroll, true)
            window.removeEventListener('resize', close)
            window.removeEventListener('blur', close)
        }
    }, [close, opener, anchor])

    function onKeyDown(event: KeyboardEvent) {
        const move = MOVES[event.key]

        if (move) {
            event.preventDefault()
            focusItem(ref.current!, move)
        } else if (event.key === 'Escape' || event.key === 'Tab') {
            event.preventDefault()
            close()
        }
    }

    function onClick(event: MouseEvent) {
        if ((event.target as HTMLElement).closest(ITEM_SELECTOR)) {
            close()
        }
    }

    return {
        ref,
        onKeyDown,
        onClick,
    }
}
