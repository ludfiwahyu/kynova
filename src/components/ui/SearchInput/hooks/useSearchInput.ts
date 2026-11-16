import type { ChangeEvent, KeyboardEvent, MouseEvent } from 'react'

import type { SearchInputOptions } from '@/components/ui/SearchInput/types'

export function useSearchInput({ value, onChange, onKeyDown }: SearchInputOptions) {
    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        onChange(event.target.value)
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Escape' && value) {
            event.stopPropagation()
            onChange('')
        }

        onKeyDown?.(event)
    }

    function keepFocus(event: MouseEvent) {
        event.preventDefault()
    }

    function clear() {
        onChange('')
    }

    return {
        handleChange,
        handleKeyDown,
        keepFocus,
        clear,
    }
}
