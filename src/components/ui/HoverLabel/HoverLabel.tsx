import { HoverLabelCard } from '@/components/ui/HoverLabel/components/HoverLabelCard'
import { useHoverLabel } from '@/components/ui/HoverLabel/hooks/useHoverLabel'
import type { HoverLabelProps } from '@/components/ui/HoverLabel/types'

/**
 * A label that floats under whatever it wraps when the pointer rests on it: a title,
 * a detail line and a hint. It takes no space of its own, and goes away when the
 * pointer leaves, a button is pressed, a drag starts, a key is pressed or anything scrolls.
 */
export function HoverLabel({ children, ...content }: HoverLabelProps) {
    const label = useHoverLabel()

    return (
        <span
            className="contents"
            onPointerEnter={label.handlePointerEnter}
            onPointerLeave={label.hide}
            onPointerDownCapture={label.hide}
            onDragStartCapture={label.hide}
        >
            {children}

            {label.anchor && (
                <HoverLabelCard
                    anchor={label.anchor}
                    {...content}
                />
            )}
        </span>
    )
}
