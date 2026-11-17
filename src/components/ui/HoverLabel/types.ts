import type { ReactNode } from 'react'

export interface HoverLabelProps {
    /** The bold first line, such as a request's name. */
    title: string
    /** The second line, in the code font, such as a request's address. */
    detail?: ReactNode
    /** A small note on the last line, in muted text. */
    hint?: string
    /** Shown before the detail, such as the method label. */
    lead?: ReactNode
    /** The element to rest the pointer on. */
    children: ReactNode
}

export interface HoverLabelCardProps extends Omit<HoverLabelProps, 'children'> {
    anchor: HTMLElement
}
