import { Button, Dialog, Field, Input, Select } from '@/components'
import { useSaveAsDialog } from '@/pages/request/hooks/useSaveAsDialog'
import type { SaveAsDialogProps } from '@/pages/request/types'
import { MAX_NAME_LENGTH } from '#shared/limits.ts'

export function SaveAsDialog(props: SaveAsDialogProps) {
    const { onClose } = props
    const dialog = useSaveAsDialog(props)

    return (
        <Dialog
            title="Save As"
            onClose={onClose}
        >
            <form
                className="dialog-form"
                onSubmit={dialog.submit}
            >
                <Field label="Request name">
                    <Input
                        value={dialog.name}
                        maxLength={MAX_NAME_LENGTH}
                        autoFocus
                        onFocus={(event) => event.target.select()}
                        onValueChange={dialog.setName}
                    />
                </Field>

                <div className="field">
                    <span>Save to</span>

                    <Select
                        label="Save to"
                        value={dialog.parentId}
                        options={dialog.destinations}
                        onChange={dialog.setParentId}
                    />
                </div>

                <p className="muted">Comments stay with the original request.</p>

                <div className="dialog-actions">
                    <Button onClick={onClose}>Cancel</Button>

                    <Button
                        variant="primary"
                        submit
                        disabled={!dialog.canSave}
                    >
                        Save
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}
