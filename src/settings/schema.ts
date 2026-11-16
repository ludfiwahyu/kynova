import { JSON_STYLES } from '@/utils'

import { CODE_FONTS, fontChoices, UI_FONTS } from './fonts'
import { EDITOR_DEFAULTS, type Preferences, SHAPE_DEFAULTS } from './preferences'

// ===================================================================
//
//   Types
//
// ===================================================================

/** The preferences whose value is of type `V`. */
type KeysOf<V> = {
    [K in keyof Preferences]: Preferences[K] extends V ? K : never
}[keyof Preferences]

export interface Choice {
    value: string
    label: string

    /** A second line under the label, in a dropdown. */
    hint?: string
}

/** What every setting has, whatever its control. */
interface Common {
    label: string
    description?: string
}

/** An on/off switch. */
interface SwitchField {
    control: 'switch'
    key: KeysOf<boolean>
}

/** A number field, with an optional unit and range. */
interface NumberField {
    control: 'number'
    key: KeysOf<number>

    /** What a screen reader says for the field, with its unit. */
    fieldLabel: string

    unit?: string
    min?: number
    max?: number
}

/** A dropdown, or radio buttons for two or three short choices. */
interface ChoiceField {
    control: 'select' | 'radio'
    key: KeysOf<string>
    options: Choice[]
}

// prettier-ignore
export type SettingField = Common & (
    | SwitchField
    | NumberField
    | ChoiceField
)

export interface SettingGroup {
    title: string

    /** Values a Reset button next to the title puts back. */
    reset?: Partial<Preferences>

    fields: SettingField[]
}

// ===================================================================
//
//   Shared choices
//
// ===================================================================

/** For both auto closing settings, as in VS Code. */
const AUTO_CLOSING: Choice[] = [
    {
        value: 'languageDefined',
        label: 'Language defined',
        hint: 'Before a space, a line end or a closing character',
    },

    {
        value: 'always',
        label: 'Always',
        hint: 'Whatever comes next',
    },

    {
        value: 'never',
        label: 'Never',
        hint: 'Not even around a selection',
    },
]

const INDENT_TYPES: Choice[] = [
    {
        value: 'space',
        label: 'Space',
    },

    {
        value: 'tab',
        label: 'Tab',
    },
]

const JSON_STYLE_CHOICES: Choice[] = JSON_STYLES.map((style) => ({
    value: style.id,
    label: style.label,
}))

// ===================================================================
//
//   Shape
//
// ===================================================================

const SHAPE: SettingGroup = {
    title: 'Shape',
    reset: SHAPE_DEFAULTS,

    fields: [
        {
            key: 'cornerStyle',
            control: 'radio',
            label: 'Corners',
            description: 'How round containers, buttons, fields and menus are.',

            options: [
                {
                    value: 'sharp',
                    label: 'Sharp',
                },
                {
                    value: 'default',
                    label: 'Default',
                },
                {
                    value: 'round',
                    label: 'Round',
                },
            ],
        },

        {
            key: 'controlSize',
            control: 'radio',
            label: 'Size',
            description: 'The height of buttons, fields, rows and bars.',

            options: [
                {
                    value: 'compact',
                    label: 'Compact',
                },
                {
                    value: 'default',
                    label: 'Default',
                },
                {
                    value: 'comfortable',
                    label: 'Comfortable',
                },
            ],
        },

        {
            key: 'iconWeight',
            control: 'radio',
            label: 'Icon weight',
            description: 'How thick the lines of icons are.',

            options: [
                {
                    value: 'light',
                    label: 'Light',
                },
                {
                    value: 'default',
                    label: 'Default',
                },
                {
                    value: 'bold',
                    label: 'Bold',
                },
            ],
        },
    ],
}

// ===================================================================
//
//   Request
//
// ===================================================================

const REQUEST: SettingGroup = {
    title: 'Request',

    fields: [
        {
            key: 'requestTimeoutMs',
            control: 'number',
            label: 'Request timeout',
            description:
                "How long to wait for a response. 0 uses the server's limit of 30 seconds; the most is 5 minutes.",

            fieldLabel: 'Request timeout in milliseconds',
            unit: 'ms',
            max: 300_000,
        },

        {
            key: 'maxResponseMb',
            control: 'number',
            label: 'Max response size',
            description:
                "Responses larger than this are cut off. 0 uses the server's limit of 10 MB, which is also the most.",

            fieldLabel: 'Max response size in megabytes',
            unit: 'MB',
            max: 10,
        },

        {
            key: 'followRedirects',
            control: 'switch',
            label: 'Automatically follow redirects',
            description:
                'When off, a redirect response is shown as it is. A server shared on a network never follows redirects.',
        },

        {
            key: 'sendNoCacheHeader',
            control: 'switch',
            label: 'Send no-cache header',
            description: 'Adds Cache-Control: no-cache unless the request sets its own.',
        },
    ],
}

// ===================================================================
//
//   User interface
//
// ===================================================================

const USER_INTERFACE: SettingGroup = {
    title: 'User interface',

    fields: [
        {
            key: 'alwaysOpenInNewTab',
            control: 'switch',
            label: 'Always open sidebar item in new tab',
            description:
                'When off, a single click opens a preview tab that the next click replaces.',
        },

        {
            key: 'showTabIcons',
            control: 'switch',
            label: 'Show icons with tab names',
        },

        {
            key: 'uiFont',
            control: 'select',
            label: 'Interface font',
            description: 'The font of menus, the sidebar, tables and everything that is not code.',

            options: fontChoices(UI_FONTS),
        },
    ],
}

// ===================================================================
//
//   Editor
//
// ===================================================================

const EDITOR: SettingGroup = {
    title: 'Code editor',
    reset: EDITOR_DEFAULTS,

    fields: [
        // Font

        {
            key: 'editorFontSize',
            control: 'number',
            label: 'Font size',
            description: 'For bodies, scripts, snippets and responses.',

            fieldLabel: 'Editor font size in pixels',
            unit: 'px',
            min: 10,
            max: 20,
        },

        {
            key: 'codeFont',
            control: 'select',
            label: 'Code font',
            description: 'For bodies, scripts, snippets and responses.',

            options: fontChoices(CODE_FONTS),
        },

        // Indentation

        {
            key: 'indentSize',
            control: 'number',
            label: 'Indentation count',
            description: 'How many spaces Tab adds in the code editor.',

            fieldLabel: 'Indentation count',
            min: 1,
            max: 8,
        },

        {
            key: 'indentType',
            control: 'radio',
            label: 'Indentation type',
            description: 'Indent lines of code with spaces or with a tab.',

            options: INDENT_TYPES,
        },

        // JSON

        {
            key: 'jsonStyle',
            control: 'select',
            label: 'JSON style',
            description:
                'How JSON bodies and responses are written on your screen. Requests are still sent, saved and exported as plain JSON.',

            options: JSON_STYLE_CHOICES,
        },

        // Typing

        {
            key: 'autoClosingBrackets',
            control: 'select',
            label: 'Auto closing brackets',
            description:
                'Typing ( [ or { adds the closing bracket, and wraps a selection in the pair. Like VS Code’s editor.autoClosingBrackets.',

            options: AUTO_CLOSING,
        },

        {
            key: 'autoClosingQuotes',
            control: 'select',
            label: 'Auto closing quotes',
            description:
                'Typing a quote adds the closing quote, and wraps a selection in quotes. Like VS Code’s editor.autoClosingQuotes.',

            options: AUTO_CLOSING,
        },

        // Layout

        {
            key: 'wordWrap',
            control: 'switch',
            label: 'Word wrap',
            description:
                'Long lines break at the edge of the editor instead of scrolling sideways. ⌥Z on a Mac, Alt+Z on Windows switches it, as in VS Code.',
        },

        // Formatting

        {
            key: 'formatOnBlur',
            control: 'switch',
            label: 'Format JSON on blur',
            description:
                'Beautifies a JSON body when you leave the editor. Text that is not JSON yet is left alone.',
        },

        {
            key: 'trailingComma',
            control: 'switch',
            label: 'Trailing commas',
            description:
                'Beautify ends the last member of every object and array with a comma, as JavaScript does. A copied line then stays valid, and the request is still sent as plain JSON.',
        },
    ],
}

// ===================================================================
//   The groups of each Settings section, top to bottom
// ===================================================================

// prettier-ignore
export const GENERAL_SETTINGS: SettingGroup[] = [
    REQUEST,
    USER_INTERFACE,
]

export const EDITOR_SETTINGS: SettingGroup[] = [EDITOR]

export const SHAPE_SETTINGS: SettingGroup[] = [SHAPE]
