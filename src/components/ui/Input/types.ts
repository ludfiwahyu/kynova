import type { ComponentProps } from 'react'

export type InputVariant = 'default' | 'code' | 'plain'

export interface InputProps extends ComponentProps<'input'> {
    variant?: InputVariant
    onValueChange?: (value: string) => void
}
