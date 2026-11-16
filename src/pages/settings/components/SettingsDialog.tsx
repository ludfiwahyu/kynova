import { X } from 'lucide-react'

import { Button } from '@/components'
import { AboutSection } from '@/pages/settings/components/AboutSection'
import { AccountSection } from '@/pages/settings/components/AccountSection'
import { SettingGroupList } from '@/pages/settings/components/SettingGroupList'
import { ShortcutsSection } from '@/pages/settings/components/ShortcutsSection'
import { ThemesSection } from '@/pages/settings/components/ThemesSection'
import { useSettingsDialog } from '@/pages/settings/hooks/useSettingsDialog'
import { CLOSE_ICON_SIZE, NAV_ICON_SIZE } from '@/pages/settings/logic/config'
import { EDITOR_SETTINGS, GENERAL_SETTINGS } from '@/settings'

export function SettingsDialog() {
    const dialog = useSettingsDialog()

    if (!dialog.section) {
        return null
    }

    return (
        <dialog
            ref={dialog.dialogRef}
            className="settings-dialog"
            aria-labelledby="settings-title"
            onCancel={dialog.handleCancel}
        >
            <nav
                className="settings-nav"
                aria-label="Settings sections"
            >
                {dialog.sections.map(({ id, label, icon: Icon }) => (
                    <Button
                        key={id}
                        variant="plain"
                        aria-current={id === dialog.section ? 'page' : undefined}
                        icon={<Icon size={NAV_ICON_SIZE} />}
                        onClick={() => dialog.choose(id)}
                    >
                        {label}
                    </Button>
                ))}
            </nav>

            <div className="settings-content">
                <header className="settings-header">
                    <h2 id="settings-title">{dialog.title}</h2>

                    <Button
                        variant="icon"
                        icon={<X size={CLOSE_ICON_SIZE} />}
                        aria-label="Close settings"
                        onClick={dialog.close}
                    />
                </header>

                <div
                    ref={dialog.scrollRef}
                    className="settings-scroll"
                    key={dialog.section}
                >
                    {dialog.section === 'general' && <SettingGroupList groups={GENERAL_SETTINGS} />}
                    {dialog.section === 'editor' && <SettingGroupList groups={EDITOR_SETTINGS} />}
                    {dialog.section === 'themes' && <ThemesSection />}
                    {dialog.section === 'shortcuts' && <ShortcutsSection />}
                    {dialog.section === 'account' && <AccountSection />}
                    {dialog.section === 'about' && <AboutSection />}
                </div>
            </div>
        </dialog>
    )
}
