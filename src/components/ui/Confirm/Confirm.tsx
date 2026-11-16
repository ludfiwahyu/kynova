import { Button } from '@/components/ui/Button/Button'
import { useConfirmHost } from '@/components/ui/Confirm/hooks/useConfirmHost'
import { Dialog } from '@/components/ui/Dialog/Dialog'

export function ConfirmHost() {
    const host = useConfirmHost()

    if (!host.current) {
        return null
    }

    return (
        <Dialog
            title={host.current.title}
            onClose={host.cancel}
        >
            <p className="muted">{host.current.message}</p>

            <div className="dialog-actions">
                <Button onClick={host.cancel}>Cancel</Button>

                <Button
                    variant="danger"
                    onClick={host.accept}
                >
                    {host.current.action}
                </Button>
            </div>
        </Dialog>
    )
}
