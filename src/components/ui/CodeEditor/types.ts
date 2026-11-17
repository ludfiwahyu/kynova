import type { Preferences } from '@/settings'
import type { Variables } from '@/utils'

export interface CodeEditorProps {
    value: string
    onChange: (value: string) => void
    label: string
    disabled?: boolean
    /** Shown at full colour and selectable, but not editable, as generated code is. */
    readOnly?: boolean
    placeholder?: string
    minRows?: number
    /**
     * Fills the height of its container instead of `minRows` lines, so moving the divider
     * around the request pane resizes it. The container must give it a height.
     */
    fill?: boolean
    /** Colouring and indentation rules. `jsonLoose` is JSON in single quotes or none, coloured by its own reader; `keyValue` is Bulk Edit's `key:value` lines; `text` indents by brackets alone. */
    language?: CodeLanguage
    /** Colours `{{variables}}`: known ones in the accent colour, unknown ones in red. */
    variables?: Variables
    /** When focus leaves the editor (not for its own find panel). */
    onBlur?: () => void
}

export type CodeLanguage =
    | 'json'
    | 'jsonLoose'
    | 'javascript'
    | 'keyValue'
    | 'text'
    // Code snippet languages, coloured only
    | 'shell'
    | 'python'
    | 'ruby'
    | 'go'
    | 'c'
    | 'csharp'
    | 'java'
    | 'dart'
    | 'php'
    | 'http'
    // Response body languages, coloured only
    | 'html'
    | 'xml'
    | 'css'
    | 'yaml'

export type EditingPreferences = Pick<
    Preferences,
    'indentSize' | 'indentType' | 'autoClosingBrackets' | 'autoClosingQuotes'
>
