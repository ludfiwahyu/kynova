import { useResizeHandle } from '@/components/ui/ResizeHandle/hooks/useResizeHandle'
import type { ResizeHandleProps } from '@/components/ui/ResizeHandle/types'
import { classNames } from '@/components/utils/helpers'

import { DEFAULT_STEP } from './logic/config'

export function ResizeHandle({
    orientation,
    label,
    onDrag,
    onDragStart,
    step = DEFAULT_STEP,
    onReset,
    className,
}: ResizeHandleProps) {
    const handle = useResizeHandle({
        orientation,
        onDrag,
        onDragStart,
        step,
    })

    return (
        <div
            className={classNames('resize-handle', className)}
            data-orientation={orientation}
            role="separator"
            aria-orientation={orientation}
            aria-label={label}
            tabIndex={0}
            onPointerDown={handle.handlePointerDown}
            onPointerMove={handle.handlePointerMove}
            onPointerUp={handle.handlePointerUp}
            onDoubleClick={onReset}
            onKeyDown={handle.handleKeyDown}
        />
    )
}
