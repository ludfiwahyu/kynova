import { useState } from 'react'

import { usePrefersDark } from '@/hooks'
import type { PanelId, ThemeChoice } from '@/pages/workspace/types'
import { chosenTheme, themeScheme, usePreferences } from '@/settings'
import { saveWorkspaceSettings, useWorkspaceSettings } from '@/stores'
import type { WorkspaceSettings } from '#shared/types.ts'

export function useWorkspaceTheme(isOwner: boolean) {
    const saved = useWorkspaceSettings()
    const personalTheme = chosenTheme(usePreferences(), usePrefersDark())

    const [accent, setAccent] = useState(saved.accentColor)
    const [theme, setTheme] = useState<ThemeChoice>(saved.theme)

    const themeChanged = accent !== saved.accentColor || theme !== saved.theme
    const previewTheme = theme ?? themeScheme(personalTheme)
    const canApply = isOwner && themeChanged
    const canReset = isOwner && Boolean(saved.accentColor || saved.theme)

    function save(changes: Partial<WorkspaceSettings>) {
        const next: WorkspaceSettings = {
            ...saved,
            ...changes,
        }

        // Absent means default, so defaults are removed rather than stored.
        if (!next.accentColor) {
            delete next.accentColor
        }

        if (!next.theme) {
            delete next.theme
        }

        saveWorkspaceSettings(next)
    }

    function togglePanel(id: PanelId, checked: boolean) {
        if (id === 'collections') {
            return
        }

        save({
            panels: {
                ...saved.panels,
                [id]: checked,
            },
        })
    }

    function applyTheme() {
        save({
            accentColor: accent,
            theme,
        })
    }

    function resetTheme() {
        setAccent(undefined)
        setTheme(undefined)
        save({
            accentColor: undefined,
            theme: undefined,
        })
    }

    return {
        saved,
        accent,
        theme,
        previewTheme,
        canApply,
        canReset,
        setAccent,
        setTheme,
        togglePanel,
        applyTheme,
        resetTheme,
    }
}
