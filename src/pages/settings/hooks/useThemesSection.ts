import { usePrefersDark } from '@/hooks'
import { toThemeCards } from '@/pages/settings/logic/mappers'
import type { ThemeField } from '@/pages/settings/types'
import { setPreferences, type ThemeName, usePreferences } from '@/settings'
import { useWorkspaceSettings } from '@/stores'

export function useThemesSection() {
    const preferences = usePreferences()
    const prefersDark = usePrefersDark()
    const workspaceTheme = useWorkspaceSettings().theme

    const cards = toThemeCards(preferences, prefersDark)

    function chooseMode(themeMode: 'system' | 'manual') {
        setPreferences({ themeMode })
    }

    function chooseTheme(field: ThemeField, theme: ThemeName) {
        setPreferences({ [field]: theme })
    }

    return {
        themeMode: preferences.themeMode,
        workspaceTheme,
        cards,
        chooseMode,
        chooseTheme,
    }
}
