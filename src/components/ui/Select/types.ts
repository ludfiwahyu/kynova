import type { ReactNode } from 'react'

export interface SelectOption<T extends string> {
    value: T
    label: string
    icon?: ReactNode
    hint?: string
    className?: string
    startsGroup?: boolean
}

export interface SelectProps<T extends string> {
    value: T
    options: SelectOption<T>[]
    onChange: (value: T) => void
    label: string
    disabled?: boolean
    variant?: 'field' | 'quiet'
    className?: string
    data?: Record<`data-${string}`, string>
}

export interface OptionView<T extends string> {
    option: SelectOption<T>
    className: string
    isSelected: boolean
    lineKey: string
}
