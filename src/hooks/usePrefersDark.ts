import { useSyncExternalStore } from 'react'

const DARK = '(prefers-color-scheme: dark)'

function subscribe(onChange: () => void): () => void {
    const query = matchMedia(DARK)

    query.addEventListener('change', onChange)

    return () => query.removeEventListener('change', onChange)
}

/** Whether the operating system is set to dark, kept up to date as it changes. */
export function usePrefersDark(): boolean {
    return useSyncExternalStore(subscribe, () => matchMedia(DARK).matches)
}
