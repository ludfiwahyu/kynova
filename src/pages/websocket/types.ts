import type { SocketMessage } from '@/stores'
import type { WebSocketItem } from '#shared/types.ts'

export interface WebSocketWorkbenchProps {
    item: WebSocketItem
}

export interface MessageRowProps {
    message: SocketMessage
}
