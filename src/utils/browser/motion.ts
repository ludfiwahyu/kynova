import { animate } from 'motion/mini'
import { flushSync } from 'react-dom'

/** The app's ease-out curve, the same as `--ease-out` in tokens.css. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const

export function prefersReducedMotion(): boolean {
    return (
        typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    )
}

export interface Movement {
    /** Where it starts, in pixels right of its place (negative: left). */
    x?: number
    /** Where it starts, in pixels below its place (negative: above). */
    y?: number
    /** Seconds. */
    duration?: number
}

const offset = (x: number, y: number) => `translate(${x}px, ${y}px)`

/** Fades an element in as it appears, settling into place from `x` and `y`. */
export function enter(element: Element, { x = 0, y = 0, duration = 0.16 }: Movement = {}): void {
    if (prefersReducedMotion()) {
        return
    }

    const moves = x !== 0 || y !== 0

    animate(
        element,
        {
            opacity: [0, 1],
            ...(moves ? { transform: [offset(x, y), 'none'] } : {}),
        },
        {
            duration,
            ease: EASE_OUT,
        },
    )
}

/**
 * Slides an element from where it was to where it is now, after the layout moved it
 * (`dx`, `dy`: old position minus new). Lists use it so their rows glide into place.
 */
export function glide(element: Element, dx: number, dy = 0, duration = 0.2): void {
    if (prefersReducedMotion() || (dx === 0 && dy === 0)) {
        return
    }

    animate(
        element,
        { transform: [offset(dx, dy), 'none'] },
        {
            duration,
            ease: EASE_OUT,
        },
    )
}

/**
 * Fades an element out before it goes, moving towards `x` and `y`, and resolves when it
 * is done. The element takes no clicks meanwhile, so nothing is chosen on its way out.
 */
export async function leave(
    element: Element,
    { x = 0, y = 0, duration = 0.1 }: Movement = {},
): Promise<void> {
    if (prefersReducedMotion()) {
        return
    }

    ;(element as HTMLElement).style.pointerEvents = 'none'

    const moves = x !== 0 || y !== 0

    await animate(
        element,
        {
            opacity: [1, 0],
            ...(moves ? { transform: ['none', offset(x, y)] } : {}),
        },
        {
            duration,
            ease: 'easeIn',
        },
    )
}

/** Elements that glide to their new place when a panel is moved to another side. */
const LAYOUT_FLIP = '[data-layout-flip]'

/**
 * Runs `update`, which moves panels to another side, and slides every `[data-layout-flip]`
 * element from where it was to where it lands, fading up as it goes; a new one fades in.
 */
export function flipLayout(update: () => void, duration = 0.45): void {
    if (prefersReducedMotion()) {
        update()

        return
    }

    const before = new Map(
        [...document.querySelectorAll(LAYOUT_FLIP)].map((element) => [
            element,
            element.getBoundingClientRect(),
        ]),
    )

    flushSync(update)

    for (const element of document.querySelectorAll(LAYOUT_FLIP)) {
        const was = before.get(element)

        if (!was) {
            enter(element, { duration })
            continue
        }

        const now = element.getBoundingClientRect()
        const dx = was.left - now.left
        const dy = was.top - now.top

        if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(was.width - now.width) < 1) {
            continue
        }

        animate(
            element,
            {
                transform: [offset(dx, dy), 'none'],
                opacity: [0.35, 1],
            },
            {
                duration,
                ease: EASE_OUT,
            },
        )
    }
}
