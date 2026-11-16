import type { CodeLanguage } from '@/components'
import { useStyledJson } from '@/pages/request/hooks/useStyledJson'
import { LANGUAGES, TYPES } from '@/pages/request/logic/config'
import { emptyBody } from '@/pages/request/logic/helpers'
import type { BodyEditorProps } from '@/pages/request/types'
import { usePreferences } from '@/settings'
import type { Body, KeyValue, RawLanguage } from '#shared/types.ts'

export function useBodyEditor({ body, onChange, disabled }: BodyEditorProps) {
    const formatOnBlur = usePreferences((preferences) => preferences.formatOnBlur)

    const isRaw = body.type === 'raw'
    const isJson = body.type === 'raw' && body.language === 'json'
    const rawText = body.type === 'raw' ? body.text : ''
    const rawLanguage: RawLanguage = body.type === 'raw' ? body.language : 'json'
    const fields = body.type === 'urlencoded' ? body.fields : []

    function changeRawText(text: string) {
        if (body.type === 'raw') {
            onChange({
                ...body,
                text,
            })
        }
    }

    const json = useStyledJson({
        text: rawText,
        onChange: changeRawText,
    })

    let plainLanguage: CodeLanguage = 'text'

    if (rawLanguage === 'javascript') {
        plainLanguage = 'javascript'
    }

    const editorValue = isJson ? json.shown : rawText
    const editorPlaceholder = isJson ? json.placeholder : ''
    const editorLanguage = isJson ? json.language : plainLanguage
    const blurHandler = isJson && formatOnBlur && !disabled ? json.beautify : undefined
    const changeEditor = isJson ? json.change : changeRawText

    function changeType(type: Body['type']) {
        onChange(emptyBody(type))
    }

    function changeLanguage(language: RawLanguage) {
        if (body.type === 'raw') {
            onChange({
                ...body,
                language,
            })
        }
    }

    function changeFields(next: KeyValue[]) {
        if (body.type === 'urlencoded') {
            onChange({
                ...body,
                fields: next,
            })
        }
    }

    return {
        types: TYPES,
        languageOptions: LANGUAGES.map(({ id, label }) => ({
            value: id,
            label,
        })),
        isRaw,
        isJson,
        isNone: body.type === 'none',
        isUrlencoded: body.type === 'urlencoded',
        rawLanguage,
        fields,
        editorValue,
        editorPlaceholder,
        editorLanguage,
        blurHandler,
        beautify: json.beautify,
        changeEditor,
        changeType,
        changeLanguage,
        changeFields,
    }
}
