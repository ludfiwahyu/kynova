import type { ComponentProps, ReactNode } from 'react'

export type ButtonVariant =
    | 'default'
    | 'primary'
    | 'ghost'
    | 'danger'
    | 'link'
    | 'icon'
    | 'send'
    | 'topbarIcon'
    | 'statusbarText'
    | 'dbChoice'
    | 'swatch'
    | 'plain'

export interface ButtonProps extends ComponentProps<'button'> {
    variant?: ButtonVariant
    icon?: ReactNode
    iconEnd?: ReactNode
    submit?: boolean
}
