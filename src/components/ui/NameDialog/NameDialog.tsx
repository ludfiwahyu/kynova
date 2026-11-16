import { Button } from '@/components/ui/Button/Button'
import { Dialog } from '@/components/ui/Dialog/Dialog'
import { Field } from '@/components/ui/Field/Field'
import { FormError } from '@/components/ui/FormError/FormError'
import { Input } from '@/components/ui/Input/Input'
import { useNameDialog } from '@/components/ui/NameDialog/hooks/useNameDialog'
import { MAX_NAME_LENGTH } from '@/components/ui/NameDialog/logic/config'
import type { NameDialogProps } from '@/components/ui/NameDialog/types'

export function NameDialog(props: NameDialogProps) {
    const { title, label, action, onClose } = props
    const dialog = useNameDialog(props)

    return (
        <Dialog
            title={title}
            onClose={onClose}
        >
            <form
                className="dialog-form"
                onSubmit={dialog.submit}
            >
                <Field label={label}>
                    <Input
                        value={dialog.name}
                        maxLength={MAX_NAME_LENGTH}
                        autoFocus
                        required
                        onValueChange={dialog.setName}
                    />
                </Field>

                {dialog.error && <FormError>{dialog.error}</FormError>}

                <div className="dialog-actions">
                    <Button onClick={onClose}>Cancel</Button>

                    <Button
                        variant="primary"
                        submit
                        disabled={!dialog.canSubmit}
                    >
                        {action}
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}
