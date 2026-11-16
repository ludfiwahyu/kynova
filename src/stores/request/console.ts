import { create } from 'zustand'

import { api, type SendProgress } from '@/services'
import { newId } from '@/utils'
import { STATUS } from '#shared/http.ts'
import type { SendRequest, SendResponse } from '#shared/types.ts'
import { KB } from '#shared/units.ts'

/** Older entries drop off past this many. */
const MAX_ENTRIES = 300
/** Bodies are cut to this much, so a few large responses cannot fill the memory. */
const MAX_BODY = 64 * KB

export interface ConsoleEntry {
    id: string
    at: number
    /** The request's name, or what sent it ("OAuth 2.0 token request"). */
    source: string
    itemId?: string
    request: SendRequest
    response?: SendResponse
    error?: string
}

export const useConsole = create<{ entries: ConsoleEntry[] }>(() => ({ entries: [] }))

const cut = (text: string) =>
    text.length > MAX_BODY
        ? `${text.slice(0, MAX_BODY)}\n… cut off at ${MAX_BODY / KB} KB in the Console`
        : text

function addEntry(entry: Omit<ConsoleEntry, 'id' | 'at'>): void {
    const request = {
        ...entry.request,
        body: entry.request.body === null ? null : cut(entry.request.body),
    }
    const response = entry.response && {
        ...entry.response,
        body: entry.response.bodyIsBase64 ? '' : cut(entry.response.body),
    }

    useConsole.setState(({ entries }) => ({
        entries: [
            ...entries,
            {
                ...entry,
                request,
                response,
                id: newId(),
                at: Date.now(),
            },
        ].slice(-MAX_ENTRIES),
    }))
}

/** Sends through the server and writes the exchange, or the failure, to the Console. */
export async function sendLogged(
    request: SendRequest,
    source: string,
    itemId?: string,
    onProgress?: (progress: SendProgress) => void,
): Promise<SendResponse> {
    try {
        const response = onProgress
            ? await api.sendWithProgress(request, onProgress)
            : await api.send(request)

        addEntry({
            source,
            itemId,
            request,
            response,
        })

        return response
    } catch (error) {
        addEntry({
            source,
            itemId,
            request,
            error: (error as Error).message,
        })
        throw error
    }
}

export function clearConsole(): void {
    useConsole.setState({ entries: [] })
}

export const isProblem = (entry: ConsoleEntry) =>
    Boolean(entry.error) || (entry.response?.status ?? 0) >= STATUS.badRequest
