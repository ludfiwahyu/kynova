import { DIRECTION_ICON, MESSAGE_ICON_SIZE } from '@/pages/websocket/logic/config'
import type { MessageRowProps } from '@/pages/websocket/types'
import { formatTime } from '@/utils'

export function MessageRow({ message }: MessageRowProps) {
    const Icon = DIRECTION_ICON[message.direction]

    return (
        <li data-direction={message.direction}>
            <Icon
                size={MESSAGE_ICON_SIZE}
                aria-label={message.direction}
            />

            <span className="code grow">{message.text}</span>
            <time className="muted">{formatTime(message.at)}</time>
        </li>
    )
}
