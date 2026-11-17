import { useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import { FADE_IN } from '@/components/ui/HoverLabel/logic/config'
import { labelContainer, placeLabel } from '@/components/ui/HoverLabel/logic/helpers'
import type { HoverLabelCardProps } from '@/components/ui/HoverLabel/types'
import { enter } from '@/utils'

/** The floating card: a title, the detail under it, and a hint. */
export function HoverLabelCard({ anchor, title, detail, hint, lead }: HoverLabelCardProps) {
    const ref = useRef<HTMLDivElement>(null)

    // Placed before the first paint, so it never flashes in the wrong place.
    useLayoutEffect(() => {
        const card = ref.current

        if (!card) {
            return
        }

        const { left, top } = placeLabel(anchor, card.offsetWidth, card.offsetHeight)

        card.style.left = `${left}px`
        card.style.top = `${top}px`
        card.style.visibility = 'visible'
        enter(card, FADE_IN)
    }, [anchor])

    return createPortal(
        <div
            ref={ref}
            role="tooltip"
            className="hover-label"
            style={{ visibility: 'hidden' }}
        >
            <p className="hover-label-title">{title}</p>

            {detail && (
                <p className="hover-label-detail">
                    {lead}
                    <span className="break-all">{detail}</span>
                </p>
            )}

            {hint && <p className="hover-label-hint">{hint}</p>}
        </div>,
        labelContainer(anchor),
    )
}
