import type { FormEvent, KeyboardEvent } from 'react'
import { useState } from 'react'

import { isHexColor } from '@/components/ui/ColorTagPicker/logic/helpers'
import type { ColorTagPickerProps } from '@/components/ui/ColorTagPicker/types'

export function useColorTagPicker({ value, onChange }: ColorTagPickerProps) {
    const isCustom = value !== undefined && isHexColor(value)
    const [draft, setDraft] = useState<string>(isCustom ? value : '')

    const isValid = isHexColor(draft)

    function changeDraft(text: string) {
        setDraft(text.startsWith('#') || text === '' ? text : `#${text}`)
    }

    // Enter submits the form, which clicks Apply: the menu applies the colour and closes.
    function submit(event: FormEvent) {
        event.preventDefault()

        if (isValid) {
            onChange(draft.toLowerCase() as `#${string}`)
        }
    }

    // Home and End move the caret in the field, not the focus through the menu.
    function keepCaretKeys(event: KeyboardEvent) {
        if (event.key === 'Home' || event.key === 'End') {
            event.stopPropagation()
        }
    }

    return {
        draft,
        isValid,
        hexColor: isValid ? (draft as `#${string}`) : undefined,
        swatch: isValid ? draft : '#888888',
        changeDraft,
        submit,
        keepCaretKeys,
    }
}
