import { useState } from 'react'

import type { CodeLanguage } from '@/components'
import { JSON_PLACEHOLDER } from '@/pages/request/logic/config'
import type { StyledJsonOptions } from '@/pages/request/types'
import { indentText, usePreferences } from '@/settings'
import { formatJson, type JsonStyle, toJson, toStyle } from '@/utils'

interface Typed {
    text: string
    json: string
    style: JsonStyle
}

export function useStyledJson({ text, onChange }: StyledJsonOptions) {
    const style = usePreferences((preferences) => preferences.jsonStyle)
    const indent = usePreferences(indentText)
    const trailingComma = usePreferences((preferences) => preferences.trailingComma)

    const [typed, setTyped] = useState<Typed | null>(null)

    // Trailing commas are not JSON, so the text shown may differ from the JSON stored and sent.
    const layered = style !== 'double' || trailingComma
    const isTyped = typed !== null && typed.json === text && typed.style === style

    let shown = text

    if (layered) {
        shown = isTyped ? typed.text : (toStyle(text, style) ?? text)
    }

    const language: CodeLanguage = layered ? 'jsonLoose' : 'json'
    const placeholder = toStyle(JSON_PLACEHOLDER, style) ?? JSON_PLACEHOLDER

    function change(next: string) {
        if (!layered) {
            onChange(next)

            return
        }

        const json = toJson(next) ?? next

        setTyped({
            text: next,
            json,
            style,
        })
        onChange(json)
    }

    function beautify() {
        const formatted = formatJson(shown, style, indent, trailingComma)

        if (formatted !== null && formatted !== shown) {
            change(formatted)
        }
    }

    return {
        shown,
        language,
        placeholder,
        change,
        beautify,
    }
}
