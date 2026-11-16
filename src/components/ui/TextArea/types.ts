import type { ComponentProps } from 'react'

export type TextAreaVariant = 'default' | 'code' | 'plain'

export interface TextAreaProps extends ComponentProps<'textarea'> {
    variant?: TextAreaVariant
    onValueChange?: (value: string) => void
}
