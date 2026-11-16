import type { ChangeEvent, FocusEvent, KeyboardEvent, MouseEvent } from 'react'
import { useState } from 'react'

import type { InlineEditOptions } from '@/components/ui/InlineEdit/types'

export function useInlineEdit({ value, onSave, onCancel }: InlineEditOptions) {
    const [draft, setDraft] = useState(value)

    function handleFocus(event: FocusEvent<HTMLInputElement>) {
        event.target.select()
    }

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        setDraft(event.target.value)
    }

    function handleBlur() {
        onSave(draft)
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') {
            onSave(draft)
        }

        if (event.key === 'Escape') {
            onCancel()
        }
    }

    function handleClick(event: MouseEvent<HTMLInputElement>) {
        event.stopPropagation()
    }

    return {
        draft,
        handleFocus,
        handleChange,
        handleBlur,
        handleKeyDown,
        handleClick,
    }
}
