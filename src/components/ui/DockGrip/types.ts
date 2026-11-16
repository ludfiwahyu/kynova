import type { ReactNode } from 'react'

import type { Dock } from '@/stores'

export interface DockGripProps {
    name: string
    dock: Dock
    onDock: (dock: Dock) => void
    area: () => HTMLElement | null
    labels: Record<Dock, string>
}

export interface DockDrag {
    rect: DOMRect
    zone: Dock
}

export interface DockPlace {
    place: Dock
    label: string
    checked: boolean
    icon: ReactNode
}

export interface DockOverlayProps {
    drag: DockDrag
    label: string
}
