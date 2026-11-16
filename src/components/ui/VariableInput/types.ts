import type { FocusEvent, InputHTMLAttributes, KeyboardEvent } from 'react'

import type { VariableEntry, Variables } from '@/utils'

export interface VariableInputProps extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'value' | 'onChange'
> {
    value: string
    onChange: (value: string) => void
    variables: Variables
}

export interface Suggesting {
    start: number
    caret: number
    query: string
    active: number
}

export interface Hovered {
    start: number
    name: string
}

export interface VariableDetailsProps {
    name: string
    /** The variable, or null when nothing defines it. */
    entry: VariableEntry | null
    environmentName?: string
    /** Saves a new value where the variable is defined; absent when it cannot be changed here. */
    onSave?: (entry: VariableEntry, value: string) => void
    position: {
        left: number
        top: number
    }
    onPointerEnter: () => void
    onPointerLeave: () => void
}

export interface VariableContextValue {
    /** Every variable the fields inside can use, with where each comes from. */
    entries: VariableEntry[]
    /** The active environment's name, shown with its variables. */
    environmentName?: string
    /** Changes a variable's value where it is defined. Absent when this person cannot edit. */
    setValue?: (entry: VariableEntry, value: string) => void
}

export interface VariableInputOptions {
    value: string
    onChange: (value: string) => void
    variables: Variables
    onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void
    onBlur?: (event: FocusEvent<HTMLInputElement>) => void
}

export interface TextPart {
    text: string
    kind?: 'variable' | 'unknown' | 'path'
}

export interface SuggestionRow {
    entry: VariableEntry
    id: string
    key: string
    isActive: boolean
    className: string
    valueText: string
}

export interface SuggestionListProps {
    input: HTMLInputElement
    listId: string
    start: number
    rows: SuggestionRow[]
    onChoose: (entry: VariableEntry) => void
}
