import { Moon, Palette, Sun } from 'lucide-react'
import { createElement } from 'react'

import { CARD_ICON_SIZE, themeOptions } from '@/pages/settings/logic/config'
import type { ShortcutGroupView, ThemeCardView } from '@/pages/settings/types'
import { keysFor, type Platform, type Preferences, shortcutGroups } from '@/settings'

export function toThemeCards(preferences: Preferences, prefersDark: boolean): ThemeCardView[] {
    if (preferences.themeMode === 'system') {
        return [
            {
                field: 'dayTheme',
                icon: createElement(Sun, { size: CARD_ICON_SIZE }),
                title: 'Day theme',
                description: 'Used when your system is set to light.',
                isActive: !prefersDark,
                theme: preferences.dayTheme,
                options: themeOptions('light'),
            },
            {
                field: 'nightTheme',
                icon: createElement(Moon, { size: CARD_ICON_SIZE }),
                title: 'Night theme',
                description: 'Used when your system is set to dark.',
                isActive: prefersDark,
                theme: preferences.nightTheme,
                options: themeOptions('dark'),
            },
        ]
    }

    return [
        {
            field: 'manualTheme',
            icon: createElement(Palette, { size: CARD_ICON_SIZE }),
            title: 'Theme',
            description: 'Used all the time.',
            isActive: true,
            theme: preferences.manualTheme,
            options: themeOptions(),
        },
    ]
}

export function toShortcutGroups(platform: Platform): ShortcutGroupView[] {
    return shortcutGroups().map((group) => ({
        title: group.title,
        rows: group.shortcuts.map((shortcut) => ({
            action: shortcut.action,
            keys: keysFor(shortcut, platform),
        })),
    }))
}
