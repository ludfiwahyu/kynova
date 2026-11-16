import type { MouseEvent, SyntheticEvent } from 'react'
import { useEffect, useId, useRef } from 'react'

import type { DialogProps } from '@/components/ui/Dialog/types'
import { enter, leave } from '@/utils'

export function useDialog({ onClose }: DialogProps) {
    const ref = useRef<HTMLDialogElement>(null)
    const titleId = useId()
    const isLeaving = useRef(false)

    useEffect(() => {
        ref.current?.showModal()

        // Opacity only: a transform would make the dialog the frame that fixed popovers inside it are placed in.
        if (ref.current) {
            enter(ref.current)
        }
    }, [])

    function close() {
        if (isLeaving.current) {
            return
        }

        isLeaving.current = true

        if (!ref.current) {
            onClose()

            return
        }

        void leave(ref.current).then(onClose)
    }

    // Escape closes through the caller's state at once, not through a late native "close" event.
    function handleCancel(event: SyntheticEvent) {
        event.preventDefault()
        close()
    }

    // A click on the backdrop.
    function handleClick(event: MouseEvent) {
        if (event.target === ref.current) {
            close()
        }
    }

    return {
        ref,
        titleId,
        close,
        handleCancel,
        handleClick,
    }
}
