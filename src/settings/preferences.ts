import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { STORAGE_KEYS } from '@/constants'
import type { JsonStyle } from '@/utils'

import type { CodeFont, UiFont } from './fonts'
import type { ThemeName } from './themes'

// ===================================================================
//
//   Types
//
// ===================================================================

/** `languageDefined` closes only before whitespace or a closing character, as VS Code does by default. */
export type AutoClosing = 'always' | 'languageDefined' | 'never'

export type CornerStyle = 'sharp' | 'default' | 'round'

export type ControlSize = 'compact' | 'default' | 'comfortable'

export type IconWeight = 'light' | 'default' | 'bold'

export interface Preferences {
    // Theme

    /** `system` follows the operating system's light or dark setting. */
    themeMode: 'system' | 'manual'

    dayTheme: ThemeName
    nightTheme: ThemeName
    manualTheme: ThemeName

    // Shape

    /** How round the corners of containers, buttons and fields are. */
    cornerStyle: CornerStyle

    /** The height of buttons, fields, rows and bars. */
    controlSize: ControlSize

    /** The line weight of icons. */
    iconWeight: IconWeight

    // Request

    /** 0 uses the server's limit. */
    requestTimeoutMs: number

    /** 0 uses the server's limit. */
    maxResponseMb: number

    followRedirects: boolean
    sendNoCacheHeader: boolean

    // User interface

    /** Off: a single click opens a preview tab that the next click replaces. */
    alwaysOpenInNewTab: boolean

    showTabIcons: boolean

    /** The font of everything but code. */
    uiFont: UiFont

    // Editor

    editorFontSize: number

    /** The font of the code editor, responses and other code. */
    codeFont: CodeFont

    indentSize: number
    indentType: 'space' | 'tab'

    /** How JSON bodies and responses are written on this screen. Stored and sent JSON stays plain JSON. */
    jsonStyle: JsonStyle

    /** VS Code's editor.autoClosingBrackets: also wraps a selection when a bracket is typed. */
    autoClosingBrackets: AutoClosing

    /** VS Code's editor.autoClosingQuotes: also wraps a selection when a quote is typed. */
    autoClosingQuotes: AutoClosing

    /** Lays out a JSON body in the chosen JSON style when the editor loses focus. */
    formatOnBlur: boolean

    /** VS Code's editor.wordWrap: long lines break at the editor's edge instead of scrolling. ⌥Z / Alt+Z. */
    wordWrap: boolean

    /** A double-click on a JSON key or value selects it with its quotes; off, without them. */
    doubleClickSelectsQuotes: boolean

    /** Beautify ends the last member of every object and array with a comma, as JavaScript allows. Sent JSON stays plain. */
    trailingComma: boolean
}

// ===================================================================
//
//   Defaults
//
// ===================================================================

export const EDITOR_DEFAULTS = {
    editorFontSize: 12,
    codeFont: 'system',
    indentSize: 2,
    indentType: 'space',
    jsonStyle: 'double',
    autoClosingBrackets: 'languageDefined',
    autoClosingQuotes: 'languageDefined',
    formatOnBlur: true,
    trailingComma: false,
    wordWrap: false,
    doubleClickSelectsQuotes: false,
} as const

export const SHAPE_DEFAULTS = {
    cornerStyle: 'default',
    controlSize: 'default',
    iconWeight: 'default',
} as const

export const DEFAULT_PREFERENCES: Preferences = {
    // Theme
    themeMode: 'system',
    dayTheme: 'light',
    nightTheme: 'dark',
    manualTheme: 'dark',

    // Shape
    ...SHAPE_DEFAULTS,

    // Request
    requestTimeoutMs: 0,
    maxResponseMb: 0,
    followRedirects: true,
    sendNoCacheHeader: true,

    // User interface
    alwaysOpenInNewTab: false,
    showTabIcons: true,
    uiFont: 'system',

    // Editor
    ...EDITOR_DEFAULTS,
}

// ===================================================================
//
//   Store
//
// ===================================================================

/** Carries over the theme picked before Settings existed, when it was kept with the rest of the interface state. */
function themeFromEarlierVersion(): Partial<Preferences> {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.ui) ?? '{}')
        const theme = saved?.state?.theme

        if (typeof theme !== 'string') {
            return {}
        }

        if (theme === 'system') {
            return { themeMode: 'system' }
        }

        return {
            themeMode: 'manual',
            manualTheme: theme as ThemeName,
        }
    } catch {
        return {}
    }
}

export const usePreferences = create<Preferences>()(
    persist(
        () => ({
            ...DEFAULT_PREFERENCES,
            ...themeFromEarlierVersion(),
        }),
        {
            name: STORAGE_KEYS.preferences,

            merge: (saved, current) => ({
                ...current,
                ...(saved as Partial<Preferences>),
            }),
        },
    ),
)

export function setPreferences(changes: Partial<Preferences>): void {
    usePreferences.setState(changes)
}

// ===================================================================
//
//   Reading preferences
//
// ===================================================================

/** The theme to show now, before any workspace theme. */
export function chosenTheme(preferences: Preferences, prefersDark: boolean): ThemeName {
    if (preferences.themeMode === 'manual') {
        return preferences.manualTheme
    }

    return prefersDark ? preferences.nightTheme : preferences.dayTheme
}

/** The text one level of indentation adds, from Settings › Code Editor. */
export function indentText(preferences: Preferences): string {
    if (preferences.indentType === 'tab') {
        return '\t'
    }

    return ' '.repeat(preferences.indentSize)
}
