/** The realtime connection to the open workspace. One socket at a time. */
import { API_SERVICES } from '@/constants'
import { loadSession } from '@/stores/auth/session'
import type { ChangeMessage, ClientChange, ClientMessage, ServerMessage } from '#shared/types.ts'

import { setVersions } from './versions'
import {
    applyChange,
    applyRequestPatch,
    applyServerMessage,
    resetWorkspace,
    setConnection,
} from './workspace'

const CLOSE_ACCESS_REVOKED = 4403
const MAX_RETRY_DELAY_MS = 10_000

let socket: WebSocket | null = null
let retryTimer: ReturnType<typeof setTimeout> | undefined
let failedAttempts = 0
/** Remembered so it can be sent again after a reconnect. */
let focusedItemId: string | null = null

/** Sequence number of the last change sent. */
let lastSeq = 0
/** Documents with changes the server has not acknowledged yet: `entity:id` to the latest seq. */
const pending = new Map<string, number>()

function documentKey(change: ClientChange): string {
    if (change.type === 'patch') {
        return `items:${change.id}`
    }

    if (change.type === 'save') {
        return `items:${change.doc.id}`
    }

    if (change.type === 'restore') {
        return `archive:${change.id}`
    }

    return `${change.entity}:${change.type === 'put' ? change.doc.id : change.id}`
}

/**
 * Applies the server's stored result of one of our changes. A document with a
 * newer change of ours still in flight is skipped; that change's ack will cover it.
 */
function acknowledge(seq: number, changes: ChangeMessage[]): void {
    for (const change of changes) {
        const key = documentKey(change)
        const latest = pending.get(key)

        if (latest !== undefined && latest > seq) {
            continue
        }

        if (latest === seq) {
            pending.delete(key)
        }

        applyChange(change)
    }
}

function receive(message: ServerMessage): void {
    switch (message.type) {
        case 'ack':
            return acknowledge(message.seq, message.changes)
        case 'put':
        case 'delete':
            // Our own unacknowledged edit wins locally until its ack brings the server's version.
            if (pending.has(documentKey(message))) {
                return
            }

            return applyServerMessage(message)
        case 'snapshot':
            pending.clear()

            return applyServerMessage(message)
        case 'versions':
            return setVersions(message.itemId, message.versions)
        default:
            return applyServerMessage(message)
    }
}

function send(message: ClientMessage): void {
    if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message))
    }
}

function open(workspaceId: string): void {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    const current = new WebSocket(`${protocol}://${location.host}${API_SERVICES.sync(workspaceId)}`)

    socket = current

    current.onopen = () => {
        failedAttempts = 0
        send({
            type: 'focus',
            itemId: focusedItemId,
        })
    }

    current.onmessage = (event) => receive(JSON.parse(event.data) as ServerMessage)

    current.onclose = (event) => {
        // Replaced or disconnected on purpose.
        if (socket !== current) {
            return
        }

        setConnection('offline')

        if (event.code === CLOSE_ACCESS_REVOKED) {
            void loadSession() // The workspace is gone from the list; the app moves to another.

            return
        }

        // Repeated failures may mean the session expired; reloading it returns to sign-in if so.
        if (failedAttempts > 1) {
            loadSession().catch(() => {})
        }

        const delay = Math.min(1000 * 2 ** failedAttempts++, MAX_RETRY_DELAY_MS)

        retryTimer = setTimeout(() => open(workspaceId), delay)
    }
}

export function connect(workspaceId: string): void {
    disconnect()
    open(workspaceId)
}

export function disconnect(): void {
    clearTimeout(retryTimer)
    const closing = socket

    socket = null
    closing?.close()
    failedAttempts = 0
    focusedItemId = null
    pending.clear()
    resetWorkspace()
}

function applyLocally(change: ClientChange): void {
    if (change.type === 'patch') {
        applyRequestPatch(change.id, change.changes)
    } else if (change.type === 'restore') {
        // The restored items arrive with the ack, already placed by the server.
    } else if (change.type === 'save') {
        applyChange({
            type: 'put',
            entity: 'items',
            doc: change.doc,
        })
    }
    // The server stamps a new comment's author and time, so it appears with the ack.
    else if (!(change.type === 'put' && change.entity === 'comments')) {
        applyChange(change)
    }
}

/** Makes a change: applies it here at once, then tells the server. */
export function commit(change: ClientChange): void {
    applyLocally(change)
    const seq = ++lastSeq

    pending.set(documentKey(change), seq)
    send({
        ...change,
        seq,
    })
}

/** Asks the server for a request's saved versions; they arrive in `useVersions`. */
export function requestVersions(itemId: string): void {
    send({
        type: 'versions',
        itemId,
    })
}

/** Tells collaborators which request is open here. */
export function setFocus(itemId: string | null): void {
    if (itemId === focusedItemId) {
        return
    }

    focusedItemId = itemId
    send({
        type: 'focus',
        itemId,
    })
}
