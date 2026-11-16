import type { ChangeEvent } from 'react'

export function classNames(...names: (string | false | null | undefined)[]): string {
    return names.filter(Boolean).join(' ')
}

type TextControl = HTMLInputElement | HTMLTextAreaElement

export function valueChange<T extends TextControl>(
    onChange?: (event: ChangeEvent<T>) => void,
    onValueChange?: (value: string) => void,
) {
    return (event: ChangeEvent<T>) => {
        onChange?.(event)
        onValueChange?.(event.target.value)
    }
}
