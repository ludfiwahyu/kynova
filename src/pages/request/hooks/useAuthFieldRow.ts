import type { ChangeEvent } from 'react'
import { useId } from 'react'

import type { CodeLanguage } from '@/components'
import { CODE_ROWS, isFlagSelect, KEY_ROWS } from '@/pages/request/logic/config'
import { current } from '@/pages/request/logic/helpers'
import type { AuthFieldRowProps } from '@/pages/request/types'

export function useAuthFieldRow({ field, values, defaults, onChange }: AuthFieldRowProps) {
    const id = useId()
    const value = current(field, values, defaults)

    // Selects and code areas name themselves with aria-label; only a text input takes a <label for>.
    const isText = !field.kind || field.kind === 'text'
    const isCheck = field.kind === 'check'
    const isSelect = field.kind === 'select'
    const isCode = field.kind === 'code' || field.kind === 'key'

    const isOn = value === true || value === 'true'
    const checked = field.inverted ? !isOn : isOn
    const selectValue = String(value ?? field.options?.[0].value)
    const codeValue = typeof value === 'string' ? value : ''
    const codePlaceholder = field.placeholder ?? (field.kind === 'code' ? '{}' : '')
    const codeRows = field.kind === 'key' ? KEY_ROWS : CODE_ROWS
    const codeLanguage: CodeLanguage = field.kind === 'code' ? 'json' : 'text'
    const textValue = typeof value === 'string' || typeof value === 'number' ? String(value) : ''

    function toggleCheck(event: ChangeEvent<HTMLInputElement>) {
        const next = event.target.checked

        onChange(field.key, field.inverted ? !next : next)
    }

    function chooseOption(chosen: string) {
        onChange(field.key, isFlagSelect(field) ? chosen === 'true' : chosen)
    }

    function changeText(text: string) {
        onChange(field.key, text)
    }

    return {
        id,
        isText,
        isCheck,
        isSelect,
        isCode,
        checked,
        selectValue,
        codeValue,
        codePlaceholder,
        codeRows,
        codeLanguage,
        textValue,
        toggleCheck,
        chooseOption,
        changeText,
    }
}
