import type { ReactNode } from 'react'

import type { useDatabasePicker } from '@/pages/database/hooks/useDatabasePicker'
import type { SslMode } from '#shared/databaseUrl.ts'

export interface DatabasePickerProps {
    onSwitched?: () => void
}

export type DatabaseChoice = 'local' | 'external'

export type Busy = 'test' | 'use' | null

export interface DatabaseResult {
    ok: boolean
    message: string
}

export type DatabasePickerState = ReturnType<typeof useDatabasePicker>

export interface DatabasePickerPartProps {
    picker: DatabasePickerState
}

export interface RecentRow {
    id: string
    label: string
    inUse: boolean
    forgetLabel: string
}

export interface ChoiceView {
    id: DatabaseChoice
    title: string
    text: string
    icon: ReactNode
}

export type { SslMode }
