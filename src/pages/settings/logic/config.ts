import { Braces, Info, Keyboard, Palette, Settings, UserRound } from 'lucide-react'

import type { ThemeName } from '@/settings'
import { THEMES } from '@/settings'
import type { SettingsSection } from '@/stores'
import { definePage } from '@/utils'

export const settingsPage = definePage({
    id: 'settings',
    title: 'Settings',
    description:
        'Personal app settings: general options, the code editor, themes and shape, shortcuts, account.',
    tabs: [
        {
            id: 'general',
            label: 'General',
        },
        {
            id: 'editor',
            label: 'Code Editor',
        },
        {
            id: 'themes',
            label: 'Themes',
        },
        {
            id: 'shortcuts',
            label: 'Shortcuts',
        },
        {
            id: 'account',
            label: 'Account',
        },
        {
            id: 'about',
            label: 'About',
        },
    ],
})

export const ICONS: Record<SettingsSection, typeof Settings> = {
    general: Settings,
    editor: Braces,
    themes: Palette,
    shortcuts: Keyboard,
    account: UserRound,
    about: Info,
}

export const SECTIONS = settingsPage.tabs.map((tab) => ({
    ...tab,
    icon: ICONS[tab.id],
}))

export const themeOptions = (scheme?: 'light' | 'dark') =>
    THEMES.filter((theme) => !scheme || theme.scheme === scheme).map(({ id, label }) => ({
        value: id as ThemeName,
        label,
    }))

export const NAV_ICON_SIZE = 16

export const CLOSE_ICON_SIZE = 18

export const CARD_ICON_SIZE = 18

export const SIGN_OUT_ICON_SIZE = 14

export const THEME_MODES = [
    {
        value: 'system',
        label: 'Sync with system',
    },
    {
        value: 'manual',
        label: 'Manual',
    },
] as const

export const PLATFORMS = [
    {
        value: 'mac',
        label: 'Mac',
    },
    {
        value: 'windows',
        label: 'Windows',
    },
] as const

export const BROWSER_KEPT_KEYS = {
    mac: '⌘W, ⌘T, ⌘N and ⌘Q',
    windows: 'Ctrl+W, Ctrl+T and Ctrl+N',
}
