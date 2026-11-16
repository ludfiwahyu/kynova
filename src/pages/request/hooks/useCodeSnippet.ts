import { useState } from 'react'

import { useVariables } from '@/hooks'
import {
    generateSnippet,
    snippetEditorLanguage,
    type SnippetLanguage,
} from '@/pages/request/logic/codegen'
import { toLanguageOptions } from '@/pages/request/logic/mappers'
import type { CodeSnippetProps } from '@/pages/request/types'
import { buildSendRequest } from '@/utils'

export function useCodeSnippet({ item }: CodeSnippetProps) {
    const variables = useVariables(item)
    const [language, setLanguage] = useState<SnippetLanguage>('curl')

    const snippet = generateSnippet(language, buildSendRequest(item.request, variables))

    return {
        language,
        snippet,
        editorLanguage: snippetEditorLanguage(language),
        ignoreEdit: () => {},
        options: toLanguageOptions(),
        setLanguage,
    }
}
