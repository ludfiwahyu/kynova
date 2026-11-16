import { RadioChoice } from '@/pages/settings/components/RadioChoice'
import { SettingGroupList } from '@/pages/settings/components/SettingGroupList'
import { SettingRow } from '@/pages/settings/components/SettingRow'
import { ThemeCard } from '@/pages/settings/components/ThemeCard'
import { useThemesSection } from '@/pages/settings/hooks/useThemesSection'
import { THEME_MODES } from '@/pages/settings/logic/config'
import { SHAPE_SETTINGS } from '@/settings'

export function ThemesSection() {
    const themes = useThemesSection()

    return (
        <div className="contents">
            <p className="settings-intro">
                Pick a theme yourself, or follow your system&apos;s light and dark setting with a
                day and a night theme.
            </p>

            {themes.workspaceTheme && (
                <p className="settings-note">
                    This workspace&apos;s owner set it to {themes.workspaceTheme}, so that is what
                    you see while you are in it. Your choice here applies everywhere else.
                </p>
            )}

            <SettingRow label="Theme selection">
                <RadioChoice
                    name="Theme selection"
                    value={themes.themeMode}
                    options={[...THEME_MODES]}
                    onChange={themes.chooseMode}
                />
            </SettingRow>

            <div className="theme-cards">
                {themes.cards.map((card) => (
                    <ThemeCard
                        key={card.field}
                        card={card}
                        onChange={themes.chooseTheme}
                    />
                ))}
            </div>

            <SettingGroupList groups={SHAPE_SETTINGS} />
        </div>
    )
}
