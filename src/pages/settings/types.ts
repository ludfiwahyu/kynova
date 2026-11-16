import type { ReactNode } from 'react'

import type { SettingField, SettingGroup, ThemeName } from '@/settings'

export interface SettingRowProps {
    label: string
    description?: ReactNode
    children: ReactNode
}

export interface NumberFieldProps {
    value: number
    onChange: (value: number) => void
    unit?: string
    label: string
    min?: number
    max?: number
}

export interface RadioOption<T extends string> {
    value: T
    label: string
}

export interface RadioChoiceProps<T extends string> {
    name: string
    value: T
    options: RadioOption<T>[]
    onChange: (value: T) => void
}

export interface SettingGroupListProps {
    groups: SettingGroup[]
}

export interface SettingControlProps {
    field: SettingField
}

export type ThemeField = 'dayTheme' | 'nightTheme' | 'manualTheme'

export interface ThemeCardView {
    field: ThemeField
    icon: ReactNode
    title: string
    description: string
    isActive: boolean
    theme: ThemeName
    options: RadioOption<ThemeName>[]
}

export interface ThemeCardProps {
    card: ThemeCardView
    onChange: (field: ThemeField, theme: ThemeName) => void
}

export interface ShortcutRowView {
    action: string
    keys: string[]
}

export interface ShortcutGroupView {
    title: string
    rows: ShortcutRowView[]
}
