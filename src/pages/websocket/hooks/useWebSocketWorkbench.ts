import type { KeyboardEvent } from 'react'
import { useState } from 'react'

import type { ButtonVariant } from '@/components'
import { useVariables } from '@/hooks'
import { MESSAGE_PLACEHOLDERS } from '@/pages/websocket/logic/config'
import { connectLabelOf } from '@/pages/websocket/logic/helpers'
import { matchesShortcut } from '@/settings'
import {
    clearSocketMessages,
    closeSocket,
    editDraft,
    openSocket,
    sendSocketMessage,
    useCanEdit,
    useSocketSession,
} from '@/stores'
import { resolveVariables } from '@/utils'
import type { WebSocketItem } from '#shared/types.ts'

export function useWebSocketWorkbench(item: WebSocketItem) {
    const canEdit = useCanEdit()
    const variables = useVariables(item)
    const session = useSocketSession(item.id)

    const [draft, setDraft] = useState('')

    const isOpen = session.status === 'open'
    const isClosed = session.status === 'closed'

    const urlDisabled = !canEdit || !isClosed
    const connectVariant: ButtonVariant = isClosed ? 'send' : 'default'
    const connectDisabled = isClosed && !item.url.trim()
    const connectLabel = connectLabelOf(isClosed, isOpen)
    const messagePlaceholder = isOpen ? MESSAGE_PLACEHOLDERS.open : MESSAGE_PLACEHOLDERS.closed
    const canSend = isOpen && draft !== ''
    const messages = [...session.messages].reverse()
    const hasMessages = messages.length > 0

    function changeUrl(url: string) {
        editDraft(item.id, { url })
    }

    function toggleConnection() {
        if (isClosed) {
            openSocket(item.id, resolveVariables(item.url.trim(), variables))

            return
        }

        closeSocket(item.id)
    }

    function sendDraft() {
        if (!canSend) {
            return
        }

        sendSocketMessage(item.id, resolveVariables(draft, variables))
        setDraft('')
    }

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (matchesShortcut(event, 'request.sendMessage')) {
            sendDraft()
        }
    }

    function clear() {
        clearSocketMessages(item.id)
    }

    return {
        status: session.status,
        draft,
        isOpen,
        urlDisabled,
        connectVariant,
        connectDisabled,
        connectLabel,
        messagePlaceholder,
        canSend,
        messages,
        hasMessages,
        setDraft,
        changeUrl,
        toggleConnection,
        sendDraft,
        handleKeyDown,
        clear,
    }
}
