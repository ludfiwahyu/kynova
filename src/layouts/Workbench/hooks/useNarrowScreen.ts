import { useSyncExternalStore } from 'react'

import { isNarrowScreen, NARROW_SCREEN } from '@/stores'

function subscribe(onChange: () => void) {
    const query = matchMedia(NARROW_SCREEN)

    query.addEventListener('change', onChange)

    return () => query.removeEventListener('change', onChange)
}

/** Whether the window is narrow, following changes. */
export function useNarrowScreen(): boolean {
    return useSyncExternalStore(subscribe, isNarrowScreen)
}
