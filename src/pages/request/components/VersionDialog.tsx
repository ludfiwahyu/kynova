import { Button, CodeEditor, Dialog } from '@/components'
import { useVersionDialog } from '@/pages/request/hooks/useVersionDialog'
import type { VersionDialogProps } from '@/pages/request/types'

/** One saved version, read-only, with a way to make it the newest again. */
export function VersionDialog(props: VersionDialogProps) {
    const { onClose } = props
    const dialog = useVersionDialog(props)

    return (
        <Dialog
            title={dialog.title}
            onClose={onClose}
        >
            <div className="dialog-form version-dialog">
                <p className="version-summary truncate">{dialog.summary}</p>

                <CodeEditor
                    label="Saved version"
                    value={dialog.content}
                    language="json"
                    readOnly
                    minRows={14}
                    onChange={dialog.ignoreEdit}
                />

                <p className="muted">
                    Restoring saves this version as the newest. The current one stays in the
                    history.
                </p>

                <div className="dialog-actions">
                    <Button onClick={onClose}>Close</Button>

                    <Button
                        variant="primary"
                        disabled={!dialog.canRestore}
                        title={dialog.restoreTitle}
                        onClick={dialog.restore}
                    >
                        Restore
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}
