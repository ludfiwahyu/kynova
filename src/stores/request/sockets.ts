/** Live WebSocket sessions of WebSocket requests, by item id. Kept in memory only. */
import { create } from 'zustand'

import { newId } from '@/utils'

export interface SocketMessage {
    id: string
    direction: 'sent' | 'received' | 'info'
    text: string
    at: number
}

export interface SocketSession {
    status: 'connecting' | 'open' | 'closed'
    messages: SocketMessage[]
}

const CLOSED: SocketSession = {
    status: 'closed',
    messages: [],
}

export const useSockets = create<Record<string, SocketSession>>(() => ({}))

const sockets = new Map<string, WebSocket>()

export function useSocketSession(itemId: string): SocketSession {
    return useSockets((sessions) => sessions[itemId] ?? CLOSED)
}

function update(itemId: string, change: (session: SocketSession) => SocketSession): void {
    useSockets.setState((sessions) => ({ [itemId]: change(sessions[itemId] ?? CLOSED) }))
}

function log(itemId: string, direction: SocketMessage['direction'], text: string): void {
    const message: SocketMessage = {
        id: newId(),
        direction,
        text,
        at: Date.now(),
    }

    update(itemId, (session) => ({
        ...session,
        messages: [...session.messages, message],
    }))
}

export function openSocket(itemId: string, url: string): void {
    closeSocket(itemId)

    let socket: WebSocket

    try {
        socket = new WebSocket(url)
    } catch {
        log(itemId, 'info', 'That URL is not valid. It must start with ws:// or wss://.')

        return
    }

    sockets.set(itemId, socket)
    update(itemId, (session) => ({
        ...session,
        status: 'connecting',
    }))

    socket.onopen = () => {
        update(itemId, (session) => ({
            ...session,
            status: 'open',
        }))
        log(itemId, 'info', `Connected to ${url}`)
    }
    socket.onmessage = (event) => {
        log(itemId, 'received', typeof event.data === 'string' ? event.data : '(binary message)')
    }
    socket.onclose = (event) => {
        log(itemId, 'info', event.wasClean ? 'Disconnected' : 'Connection failed or was dropped')

        // A replaced socket closing late must not mark the new connection as closed.
        if (sockets.get(itemId) !== socket) {
            return
        }

        sockets.delete(itemId)
        update(itemId, (session) => ({
            ...session,
            status: 'closed',
        }))
    }
}

export function closeSocket(itemId: string): void {
    sockets.get(itemId)?.close()
}

export function sendSocketMessage(itemId: string, text: string): void {
    sockets.get(itemId)?.send(text)
    log(itemId, 'sent', text)
}

export function clearSocketMessages(itemId: string): void {
    update(itemId, (session) => ({
        ...session,
        messages: [],
    }))
}
