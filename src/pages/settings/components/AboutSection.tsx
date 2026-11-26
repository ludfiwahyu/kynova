import { Logo } from '@/components'
import { UpdatesRow } from '@/pages/settings/components/UpdatesRow'

export function AboutSection() {
    return (
        <div className="contents">
            <div className="about">
                <Logo size={40} />

                <div>
                    <div className="about-name">Kynova</div>
                    <div className="setting-description">Version {__APP_VERSION__}</div>
                </div>

                <p className="settings-intro">
                    A free API client with shared workspaces. Every feature is included; there are
                    no plans or upgrades. It is an independent project.
                </p>
            </div>

            <UpdatesRow />
        </div>
    )
}
