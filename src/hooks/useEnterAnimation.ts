import type { RefObject } from 'react'
import { useEffect } from 'react'

import type { Movement } from '@/utils'
import { enter } from '@/utils'

/**
 * Fades the element in when it first shows, and again whenever `key` changes, such as
 * the tab whose contents it holds. Nothing moves when the system asks for reduced motion.
 */
export function useEnterAnimation(
    ref: RefObject<Element | null>,
    key: unknown,
    movement?: Movement,
): void {
    useEffect(() => {
        if (ref.current) {
            enter(ref.current, movement)
        }
        // Only a new key replays it; a new `movement` object each render must not.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key])
}
