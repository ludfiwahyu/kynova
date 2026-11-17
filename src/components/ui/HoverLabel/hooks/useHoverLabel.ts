import type { PointerEvent } from 'react'
import { useEffect, useRef, useState } from 'react'

import {
    FOLLOW_DELAY_MS,
    FOLLOW_WINDOW_MS,
    SHOW_DELAY_MS,
} from '@/components/ui/HoverLabel/logic/config'

let lastHiddenAt = 0

export function useHoverLabel() {
    const [anchor, setAnchor] = useState<HTMLElement | null>(null)
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

    function hide() {
        clearTimeout(timer.current)
        setAnchor((current) => {
            if (current) {
                lastHiddenAt = Date.now()
            }

            return null
        })
    }

    function handlePointerEnter(event: PointerEvent<HTMLElement>) {
        // A finger has no hover.
        if (event.pointerType === 'touch') {
            return
        }

        const wrapper = event.currentTarget
        const target =
            wrapper.firstElementChild instanceof HTMLElement ? wrapper.firstElementChild : wrapper
        const isFollowing = Date.now() - lastHiddenAt < FOLLOW_WINDOW_MS

        clearTimeout(timer.current)
        timer.current = setTimeout(
            () => setAnchor(target),
            isFollowing ? FOLLOW_DELAY_MS : SHOW_DELAY_MS,
        )
    }

    // Anything that starts to move or change what is under the pointer takes the label away.
    useEffect(() => {
        if (!anchor) {
            return
        }

        window.addEventListener('scroll', hide, true)
        window.addEventListener('blur', hide)
        document.addEventListener('keydown', hide, true)

        return () => {
            window.removeEventListener('scroll', hide, true)
            window.removeEventListener('blur', hide)
            document.removeEventListener('keydown', hide, true)
        }
    }, [anchor])

    useEffect(() => () => clearTimeout(timer.current), [])

    return {
        anchor,
        hide,
        handlePointerEnter,
    }
}
