import { ArrowDown, ArrowUp, Info } from 'lucide-react'

export const DIRECTION_ICON = {
    sent: ArrowUp,
    received: ArrowDown,
    info: Info,
}

export const MESSAGE_ICON_SIZE = 13

export const CLEAR_ICON_SIZE = 14

export const URL_PLACEHOLDER = 'wss://echo.example.com/socket'

export const MESSAGE_PLACEHOLDERS = {
    open: 'Write a message',
    closed: 'Connect to send messages',
}
