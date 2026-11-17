import { HardDrive } from 'lucide-react'

import { Button, Dialog } from '@/components'
import { DatabasePicker } from '@/pages/database/components/DatabasePicker'
import { useDatabaseStatus } from '@/pages/database/hooks/useDatabaseStatus'
import { STATUS_ICON_SIZE } from '@/pages/database/logic/config'

export function DatabaseStatus() {
    const status = useDatabaseStatus()

    if (!status.current) {
        return null
    }

    return (
        <div className="db-status-group">
            <Button
                variant="plain"
                className="topbar-ghost db-status"
                data-kind={status.current.kind}
                icon={<HardDrive size={STATUS_ICON_SIZE} />}
                aria-label={`Database: ${status.summary}. Open database settings`}
                title={`${status.title} · Database settings`}
                onClick={status.open}
            >
                <span className="db-status-text truncate">{status.summary}</span>
            </Button>

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
