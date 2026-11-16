import { HardDrive, Plug } from 'lucide-react'

import { Button, Dialog } from '@/components'
import { DatabasePicker } from '@/pages/database/components/DatabasePicker'
import { useDatabaseStatus } from '@/pages/database/hooks/useDatabaseStatus'
import { SETTINGS_ICON_SIZE, STATUS_ICON_SIZE } from '@/pages/database/logic/config'

export function DatabaseStatus() {
    const status = useDatabaseStatus()

    if (!status.current) {
        return null
    }

    return (
        <div className="db-status-group">
            <span
                className="db-status"
                data-kind={status.current.kind}
                title={status.title}
            >
                <HardDrive size={STATUS_ICON_SIZE} />
                <span className="db-status-text truncate">{status.summary}</span>
            </span>

            <Button
                variant="topbarIcon"
                icon={<Plug size={SETTINGS_ICON_SIZE} />}
                aria-label="Database settings"
                title="Database settings"
                onClick={status.open}
            />

            {status.isOpen && (
                <Dialog
                    title="Database"
                    onClose={status.close}
                >
                    <p className="db-intro">
                        In use: <strong>{status.current.label}</strong> ({status.current.detail}).
                        Switching signs you out: your account and workspaces belong to each
                        database, and stay in it.
                    </p>

                    <DatabasePicker onSwitched={status.close} />
                </Dialog>
            )}
        </div>
    )
}
