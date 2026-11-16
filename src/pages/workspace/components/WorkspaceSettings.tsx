import { LogOut, Trash2 } from 'lucide-react'

import { Button, Switch, ThemePreview } from '@/components'
import { useWorkspaceSettingsSection } from '@/pages/workspace/hooks/useWorkspaceSettingsSection'
import { ACCENTS, THEME_ICON_SIZE } from '@/pages/workspace/logic/config'
import type { WorkspaceSectionProps } from '@/pages/workspace/types'

export function WorkspaceSettings(props: WorkspaceSectionProps) {
    const section = useWorkspaceSettingsSection(props)
    const { theme } = section

    return (
        <div className="settings-page">
            {!section.isOwner && (
                <p className="settings-note">Only the workspace owner can change these settings.</p>
            )}

            <section className="settings-section">
                <h3>Sidebar panels</h3>

                <p className="muted">
                    Choose which panels appear in the sidebar for everyone in this workspace.
                </p>

                <ul className="settings-list">
                    {section.panels.map((panel) => (
                        <li key={panel.id}>
                            <span className="grow">{panel.label}</span>

                            {panel.isLocked && <span className="muted">Always shown</span>}

                            <Switch
                                label={panel.switchLabel}
                                checked={panel.isOn}
                                disabled={panel.disabled}
                                onChange={(checked) => theme.togglePanel(panel.id, checked)}
                            />
                        </li>
                    ))}
                </ul>
            </section>

            <section className="settings-section">
                <h3>Workspace theme</h3>

                <p className="muted">
                    Give the workspace its own look. It applies to every member while they are in
                    it.
                </p>

                <div className="settings-row">
                    <div>
                        <div className="settings-label">Accent color</div>
                        <div className="muted">For buttons and highlights.</div>
                    </div>

                    <div
                        className="swatches"
                        role="radiogroup"
                        aria-label="Accent color"
                    >
                        <Button
                            variant="swatch"
                            className="swatch-none"
                            role="radio"
                            aria-checked={!theme.accent}
                            title="Theme default"
                            disabled={!section.isOwner}
                            onClick={() => theme.setAccent(undefined)}
                        />

                        {ACCENTS.map((color) => (
                            <Button
                                key={color}
                                variant="swatch"
                                role="radio"
                                aria-checked={theme.accent === color}
                                aria-label={color}
                                style={{ background: color }}
                                disabled={!section.isOwner}
                                onClick={() => theme.setAccent(color)}
                            />
                        ))}
                    </div>
                </div>

                <div className="settings-row">
                    <div>
                        <div className="settings-label">Theme</div>
                        <div className="muted">
                            Light or dark for everyone, or each person&apos;s own choice.
                        </div>
                    </div>

                    <div
                        className="segmented"
                        role="radiogroup"
                        aria-label="Workspace theme"
                    >
                        {section.themeOptions.map((option) => (
                            <Button
                                key={option.label}
                                variant="plain"
                                role="radio"
                                aria-checked={theme.theme === option.value}
                                disabled={!section.isOwner}
                                icon={option.icon}
                                onClick={() => theme.setTheme(option.value)}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </div>
                </div>

                <ThemePreview
                    theme={theme.previewTheme}
                    accent={theme.accent}
                />

                <div className="row">
                    <Button
                        variant="primary"
                        disabled={!theme.canApply}
                        onClick={theme.applyTheme}
                    >
                        Apply theme
                    </Button>

                    <Button
                        variant="ghost"
                        disabled={!theme.canReset}
                        onClick={theme.resetTheme}
                    >
                        Reset to default
                    </Button>
                </div>
            </section>

            <section className="settings-section danger-zone">
                {section.isOwner ? (
                    <>
                        <h3>Delete workspace</h3>

                        <p className="muted">
                            Once deleted, the workspace is gone for every member, with all its data.
                        </p>

                        <Button
                            variant="danger"
                            icon={<Trash2 size={THEME_ICON_SIZE} />}
                            onClick={section.remove}
                        >
                            Delete workspace
                        </Button>
                    </>
                ) : (
                    <>
                        <h3>Leave workspace</h3>

                        <p className="muted">You lose access until someone invites you again.</p>

                        <Button
                            icon={<LogOut size={THEME_ICON_SIZE} />}
                            onClick={section.leave}
                        >
                            Leave workspace
                        </Button>
                    </>
                )}
            </section>
        </div>
    )
}
