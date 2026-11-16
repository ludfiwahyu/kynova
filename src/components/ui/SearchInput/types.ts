import type { InputHTMLAttributes, KeyboardEvent, ReactNode, Ref } from 'react'

export interface SearchInputProps extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'value' | 'onChange'
> {
    value: string
    onChange: (value: string) => void
    trailing?: ReactNode
    ref?: Ref<HTMLInputElement>
}

export interface SearchInputOptions {
    value: string
    onChange: (value: string) => void
    onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void
}
