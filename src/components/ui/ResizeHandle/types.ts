export type Orientation = 'vertical' | 'horizontal'

export interface ResizeHandleProps {
    orientation: Orientation
    label: string
    onDrag: (delta: number) => void
    onDragStart: () => void
    step?: number
    onReset?: () => void
    className?: string
}

export interface ResizeHandleOptions {
    orientation: Orientation
    onDrag: (delta: number) => void
    onDragStart: () => void
    step: number
}
