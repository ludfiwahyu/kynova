import { type MouseEvent, useRef, useState } from 'react'

import { TRIGGER_SELECTOR } from '@/components/ui/Menu/logic/config'
import type { Anchor } from '@/components/ui/Menu/types'

export function useMenu() {
    const [anchor, setAnchor] = useState<Anchor | null>(null)
    const triggerRef = useRef<HTMLSpanElement>(null)

    function close() {
        setAnchor(null)

        // Back to the button that opened it, so keyboard users keep their place; unless what
        // was chosen moved the focus on, such as into a dialog it opened.
        const active = document.activeElement

        if (!active || active === document.body || active.closest('.menu')) {
            triggerRef.current?.querySelector<HTMLElement>(TRIGGER_SELECTOR)?.focus()
        }
    }

    function toggle(event: MouseEvent) {
        event.stopPropagation()
        setAnchor(anchor ? null : triggerRef.current!.getBoundingClientRect())
    }

    return {
        anchor,
        triggerRef,
        triggerProps: {
            onClick: toggle,
            'aria-expanded': anchor !== null,
            'aria-haspopup': 'menu' as const,
        },
        close,
    }
}
