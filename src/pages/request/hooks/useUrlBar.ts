import type { KeyboardEvent } from 'react'
import { useState } from 'react'

import { SEND_LABELS } from '@/pages/request/logic/config'
import type { UrlBarProps } from '@/pages/request/types'
import { matchesShortcut } from '@/settings'
import { updateRequest } from '@/stores'
import { applyUrlText, composeUrl } from '@/utils'
import type { HttpMethod } from '#shared/types.ts'

export function useUrlBar({ item, isSending, onSend }: UrlBarProps) {
    const { request } = item
    const [typed, setTyped] = useState<string | null>(null)

    // While the field is being edited it shows exactly what was typed, as long as that still
    // means the stored request. Worked out during render, so the two never lag apart.
    const stored = composeUrl(request)
    const typedMeansStored =
        typed !== null &&
        composeUrl({
            ...request,
            ...applyUrlText(request, typed),
        }) === stored

    const shown = typedMeansStored ? typed : stored
    const sendDisabled = !request.url.trim() || isSending
    const sendLabel = isSending ? SEND_LABELS.sending : SEND_LABELS.idle

    function changeMethod(method: HttpMethod) {
        updateRequest(item, { method })
    }

    function changeUrl(text: string) {
        setTyped(text)
        updateRequest(item, applyUrlText(request, text))
    }

    function endTyping() {
        setTyped(null)
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (matchesShortcut(event, 'request.sendFromUrl')) {
            onSend()
        }
    }

    return {
        method: request.method,
        shown,
        sendDisabled,
        sendLabel,
        changeMethod,
        changeUrl,
        endTyping,
        handleKeyDown,
    }
}
