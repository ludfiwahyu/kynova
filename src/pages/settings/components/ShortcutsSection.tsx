import { RadioChoice } from '@/pages/settings/components/RadioChoice'
import { SettingRow } from '@/pages/settings/components/SettingRow'
import { useShortcutsSection } from '@/pages/settings/hooks/useShortcutsSection'
import { PLATFORMS } from '@/pages/settings/logic/config'

export function ShortcutsSection() {
    const shortcuts = useShortcutsSection()

    return (
        <div className="contents">
            <SettingRow
                label="Keys for"
                description="Shows the shortcuts for Mac or for Windows and Linux."
            >
                <RadioChoice
                    name="Keys for"
                    value={shortcuts.platform}
                    options={[...PLATFORMS]}
                    onChange={shortcuts.setPlatform}
                />
            </SettingRow>

            <p className="settings-intro">
                Shortcuts that work in Kynova. In a browser they come before the browser&apos;s
                own, except the few a browser never gives to a page: {shortcuts.keptKeys}.
            </p>

            {shortcuts.groups.map((group) => (
                <section key={group.title}>
                    <h3 className="settings-group-title">{group.title}</h3>

                    {group.rows.map((row) => (
                        <div
                            key={row.action}
                            className="shortcut-row"
                        >
                            <span>{row.action}</span>

                            <span className="shortcut-keys">
                                {row.keys.map((key) => (
                                    <kbd key={key}>{key}</kbd>
                                ))}
                            </span>
                        </div>
                    ))}
                </section>
            ))}
        </div>
    )
}
