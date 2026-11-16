import { X } from 'lucide-react'

import { Button } from '@/components/ui/Button/Button'
import { useDialog } from '@/components/ui/Dialog/hooks/useDialog'
import { CLOSE_ICON_SIZE } from '@/components/ui/Dialog/logic/config'
import type { DialogProps } from '@/components/ui/Dialog/types'

export function Dialog(props: DialogProps) {
    const { title, children } = props
    const dialog = useDialog(props)

    return (
        <dialog
            ref={dialog.ref}
            className="dialog"
            aria-labelledby={dialog.titleId}
            onCancel={dialog.handleCancel}
            onClick={dialog.handleClick}
        >
            <div className="dialog-header">
                <h2 id={dialog.titleId}>{title}</h2>

                <Button
                    variant="icon"
                    icon={<X size={CLOSE_ICON_SIZE} />}
                    aria-label="Close"
                    onClick={dialog.close}
                />
            </div>

            <div className="dialog-body">{children}</div>
        </dialog>
    )
}
