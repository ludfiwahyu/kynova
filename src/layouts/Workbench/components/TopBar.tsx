import { MailPlus } from 'lucide-react'

import { Button, Logo } from '@/components'
import { AccountMenu } from '@/layouts/Workbench/components/AccountMenu'
import { DesktopMenu } from '@/layouts/Workbench/components/DesktopMenu'
import { QuickSearch } from '@/layouts/Workbench/components/QuickSearch'
import { SettingsMenu } from '@/layouts/Workbench/components/SettingsMenu'
import { TopBarMoreMenu } from '@/layouts/Workbench/components/TopBarMoreMenu'
import { WorkspaceMenu } from '@/layouts/Workbench/components/WorkspaceMenu'
import { useTopBar } from '@/layouts/Workbench/hooks/useTopBar'
import { APP_NAME, INVITE_ICON_SIZE, LOGO_SIZE } from '@/layouts/Workbench/logic/config'
import { MembersDialog, PresenceStack } from '@/pages/collaboration'
import { DatabaseStatus } from '@/pages/database'

export function TopBar() {
    const bar = useTopBar()

    return (
        <header className="topbar">
            <div className="topbar-start">
                <span className="topbar-brand">
                    <Logo size={LOGO_SIZE} />
                    <span className="topbar-wordmark">{APP_NAME}</span>
                </span>

                <DesktopMenu />

                <span
                    className="topbar-divider"
                    aria-hidden="true"
                />

                <WorkspaceMenu />
            </div>

            <QuickSearch />

            <div className="topbar-end">
                <PresenceStack />
                <DatabaseStatus />

                <Button
                    variant="plain"
                    className="topbar-ghost topbar-invite"
                    icon={<MailPlus size={INVITE_ICON_SIZE} />}
                    aria-label="Invite"
                    onClick={bar.openInvite}
                >
                    <span className="topbar-label">Invite</span>
                </Button>

                <SettingsMenu />
                <TopBarMoreMenu onInvite={bar.openInvite} />
                <AccountMenu />
            </div>

            {bar.isSharing && <MembersDialog onClose={bar.closeInvite} />}
        </header>
    )
}
