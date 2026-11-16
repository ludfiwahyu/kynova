import { create } from 'zustand'

import type { RequestVersion } from '#shared/types.ts'

interface VersionsState {
    /** Each request's saved versions, newest first, as last fetched; absent while loading. */
    byItem: Record<string, RequestVersion[]>
}

/** Saved versions of requests, fetched when someone opens a request's history. */
export const useVersions = create<VersionsState>(() => ({ byItem: {} }))

export function setVersions(itemId: string, versions: RequestVersion[]): void {
    useVersions.setState((state) => ({
        byItem: {
            ...state.byItem,
            [itemId]: versions,
        },
    }))
}
