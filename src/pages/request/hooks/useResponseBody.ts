import { useMemo, useState } from 'react'

import type { CodeLanguage } from '@/components'
import { contentType } from '@/pages/request/logic/helpers'
import type { ResponseBodyProps } from '@/pages/request/types'
import { indentText, usePreferences } from '@/settings'
import { contentLanguage, formatBytes, formatJson, formatMarkup, isFormattable } from '@/utils'

export function useResponseBody({ response }: ResponseBodyProps) {
    const [isPretty, setIsPretty] = useState(true)
    const style = usePreferences((preferences) => preferences.jsonStyle)
    const indent = usePreferences(indentText)

    const type = contentType(response)
    const shownAs = contentLanguage(type)
    const isJson = shownAs === 'json'
    const canFormat = isFormattable(shownAs)

    // Formatted JSON is written in the person's JSON style, HTML and XML one tag per line; raw is exactly what arrived.
    const text = useMemo(() => {
        if (!canFormat || !isPretty) {
            return response.body
        }

        if (isJson) {
            return formatJson(response.body, style, indent) ?? response.body
        }

        return formatMarkup(response.body, indent, shownAs === 'html') ?? response.body
    }, [response.body, canFormat, isJson, shownAs, isPretty, style, indent])

    // Single quotes or none are not JSON, so the editor reads them with its loose reader.
    let language: CodeLanguage = shownAs

    if (isJson && isPretty && style !== 'double') {
        language = 'jsonLoose'
    }

    const isBinary = response.bodyIsBase64
    const isImage = isBinary && type.startsWith('image/')
    const isOtherBinary = isBinary && !isImage
    const isBlank = !isBinary && response.body === ''
    const hasContent = !isBinary && !isBlank

    const imageSrc = `data:${type};base64,${response.body}`
    const binaryText = `${formatBytes(response.sizeBytes)} of ${type || 'unknown type'}. It cannot be shown as text.`
    const toggleLabel = isPretty ? 'Show raw' : 'Show formatted'

    function ignoreEdit() {}

    function togglePretty() {
        setIsPretty(!isPretty)
    }

    return {
        isJson,
        canFormat,
        isImage,
        isOtherBinary,
        isBlank,
        hasContent,
        text,
        language,
        imageSrc,
        binaryText,
        toggleLabel,
        togglePretty,
        ignoreEdit,
    }
}
