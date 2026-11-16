import { useMemo } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { STORAGE_KEYS } from '@/constants'
import type {
    HttpItem,
    HttpRequest,
    Item,
    RequestVersion,
    Scripts,
    WebSocketItem,
} from '#shared/types.ts'

import { commit } from './sync'
import { useWorkspace } from './workspace'

export type RequestItem = HttpItem | WebSocketItem

/** What a draft holds: the parts of a request that Save writes. */
export interface DraftContent {
    request?: HttpRequest
    url?: string
    scripts?: Scripts
}

interface Draft {
    /** The saved content the draft started from; a newer saved version means someone else saved. */
    base: DraftContent
    content: DraftContent
}

interface DraftState {
    drafts: Record<string, Draft>
}

/**
 * Request drafts: edits to a request stay here, in this browser, until Save. The last Save
 * wins; someone whose draft started from an older version is told, and decides what to keep.
 */
export const useDrafts = create<DraftState>()(
    persist(() => ({ drafts: {} }) as DraftState, {
        name: STORAGE_KEYS.drafts,
        storage: createJSONStorage(() => localStorage),
    }),
)

const isRequest = (item: Item | undefined): item is RequestItem =>
    item?.kind === 'http' || item?.kind === 'websocket'

export function contentOf(item: RequestItem): DraftContent {
    return item.kind === 'http'
        ? {
              request: item.request,
              scripts: item.scripts,
          }
        : {
              url: item.url,
              scripts: item.scripts,
          }
}

const same = (a: DraftContent, b: DraftContent) => JSON.stringify(a) === JSON.stringify(b)

/** The item as this person sees it: the stored item with their draft over it. */
export function withDraft<T extends RequestItem>(item: T, draft: Draft | undefined): T {
    if (!draft || same(draft.content, draft.base)) {
        return item
    }

    const { request, url, scripts } = draft.content

    return {
        ...item,
        ...(item.kind === 'http' && request ? { request } : {}),
        ...(item.kind === 'websocket' && url !== undefined ? { url } : {}),
        scripts,
    }
}

function stored(itemId: string): RequestItem | undefined {
    const item = useWorkspace.getState().items[itemId]

    return isRequest(item) ? item : undefined
}

function setDraft(itemId: string, draft: Draft | undefined): void {
    useDrafts.setState((state) => {
        const drafts = { ...state.drafts }

        if (draft && !same(draft.content, draft.base)) {
            drafts[itemId] = draft
        } else {
            delete drafts[itemId]
        }

        return { drafts }
    })
}

/** Changes the draft of a request, starting one from the saved version when there is none. */
export function editDraft(itemId: string, change: DraftContent): void {
    const item = stored(itemId)

    if (!item) {
        return
    }

    const draft = useDrafts.getState().drafts[itemId] ?? {
        base: contentOf(item),
        content: contentOf(item),
    }

    setDraft(itemId, {
        ...draft,
        content: {
            ...draft.content,
            ...change,
        },
    })
}

/** Changes some fields of a request's draft. */
export function editDraftRequest(itemId: string, changes: Partial<HttpRequest>): void {
    const item = stored(itemId)

    if (item?.kind !== 'http') {
        return
    }

    const current = useDrafts.getState().drafts[itemId]?.content.request ?? item.request

    editDraft(itemId, {
        request: {
            ...current,
            ...changes,
        },
    })
}

export function discardDraft(itemId: string): void {
    setDraft(itemId, undefined)
}

/** Keeps editing over a version someone else saved: the draft now counts from that version. */
export function keepDraft(itemId: string): void {
    const item = stored(itemId)
    const draft = useDrafts.getState().drafts[itemId]

    if (item && draft) {
        setDraft(itemId, {
            ...draft,
            base: contentOf(item),
        })
    }
}

/** Saves the draft for everyone. The last Save wins. */
export function saveDraft(itemId: string): void {
    const item = stored(itemId)
    const draft = useDrafts.getState().drafts[itemId]

    if (!item || !draft) {
        return
    }

    commit({
        type: 'save',
        doc: withDraft(item, draft),
    })
    discardDraft(itemId)
}

export interface DraftStatus {
    /** The item with this person's draft over it. */
    item: RequestItem | undefined
    /** The draft differs from the saved version. */
    isDirty: boolean
    /** Someone saved a newer version after this draft began. */
    hasNewerSave: boolean
}

/** The request `itemId` as this person sees it, and whether their draft is unsaved or overtaken. */
export function useDraft(itemId: string | undefined): DraftStatus {
    const item = useWorkspace((state) => (itemId ? state.items[itemId] : undefined))
    const draft = useDrafts((state) => (itemId ? state.drafts[itemId] : undefined))

    return useMemo(() => {
        if (!isRequest(item)) {
            return {
                item: undefined,
                isDirty: false,
                hasNewerSave: false,
            }
        }

        const saved = contentOf(item)
        const isDirty = Boolean(draft) && !same(draft!.content, saved)

        return {
            item: withDraft(item, draft),
            isDirty,
            hasNewerSave: isDirty && !same(draft!.base, saved),
        }
    }, [item, draft])
}

/** True when the request has unsaved changes here. */
export function hasUnsavedDraft(itemId: string): boolean {
    const item = stored(itemId)
    const draft = useDrafts.getState().drafts[itemId]

    return Boolean(item && draft && !same(draft.content, contentOf(item)))
}

/** Saves an older version as the newest, for everyone. The restore is itself a new version. */
export function restoreVersion(version: RequestVersion): void {
    const item = stored(version.itemId)

    if (!item || item.kind !== version.kind) {
        return
    }

    commit({
        type: 'save',
        doc: withDraft(item, {
            base: {},
            content: {
                request: version.request,
                url: version.url,
                scripts: version.scripts,
            },
        }),
    })
}
