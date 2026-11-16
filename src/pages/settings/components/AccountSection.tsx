import { LogOut } from 'lucide-react'

import { Avatar, Button } from '@/components'
import { SettingRow } from '@/pages/settings/components/SettingRow'
import { useAccountSection } from '@/pages/settings/hooks/useAccountSection'
import { SIGN_OUT_ICON_SIZE } from '@/pages/settings/logic/config'

export function AccountSection() {
    const account = useAccountSection()

    if (!account.user) {
        return null
    }

    return (
        <div className="contents">
            <div className="account-card">
                <Avatar
                    name={account.user.name}
                    color={account.user.color}
                />

                <div>
                    <div className="setting-label">{account.user.name}</div>
                    <div className="setting-description">{account.user.email}</div>
                </div>
            </div>

            <SettingRow
                label="Workspaces"
                description="Workspaces you belong to."
            >
                <span className="muted">{account.workspaceCount}</span>
            </SettingRow>

            <SettingRow
                label="Sign out"
                description="Signs out of Kynova in this browser."
            >
                <Button
                    icon={<LogOut size={SIGN_OUT_ICON_SIZE} />}
                    onClick={account.leave}
                >
                    Sign out
                </Button>
            </SettingRow>
        </div>
    )
}
