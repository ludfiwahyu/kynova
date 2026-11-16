import { useMemo, useState } from 'react'

import { contentType } from '@/pages/request/logic/helpers'
import { toTokenViews } from '@/pages/request/logic/mappers'
import type { ResponseBodyProps } from '@/pages/request/types'
import { indentText, usePreferences } from '@/settings'
import { formatBytes, formatJson, highlightStyled } from '@/utils'

export function useResponseBody({ response }: ResponseBodyProps) {
    const [isPretty, setIsPretty] = useState(true)
    const style = usePreferences((preferences) => preferences.jsonStyle)
    const indent = usePreferences(indentText)

    const type = contentType(response)
    const isJson = type.includes('json')

    // Formatted JSON is written in the person's JSON style; raw is exactly what arrived.
    const text = useMemo(() => {
        if (isJson && isPretty) {
            return formatJson(response.body, style, indent) ?? response.body
        }

        return response.body
    }, [response.body, isJson, isPretty, style, indent])

    const tokens = useMemo(() => (isJson ? highlightStyled(text) : null), [isJson, text])
    const tokenViews = tokens ? toTokenViews(tokens) : null

    const isBinary = response.bodyIsBase64
    const isImage = isBinary && type.startsWith('image/')
    const isOtherBinary = isBinary && !isImage
    const isBlank = !isBinary && response.body === ''
    const hasContent = !isBinary && !isBlank

    const imageSrc = `data:${type};base64,${response.body}`
    const binaryText = `${formatBytes(response.sizeBytes)} of ${type || 'unknown type'}. It cannot be shown as text.`
    const toggleLabel = isPretty ? 'Show raw' : 'Show formatted'

    function togglePretty() {
        setIsPretty(!isPretty)
    }

    return {
        isJson,
        isImage,
        isOtherBinary,
        isBlank,
        hasContent,
        text,
        tokenViews,
        imageSrc,
        binaryText,
        toggleLabel,
        togglePretty,
    }
}
