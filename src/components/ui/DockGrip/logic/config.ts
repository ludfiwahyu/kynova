import { PanelBottom, PanelLeft, PanelRight } from 'lucide-react'

import type { Dock } from '@/stores'

export const DRAG_THRESHOLD = 5

export const ICONS = {
    bottom: PanelBottom,
    left: PanelLeft,
    right: PanelRight,
}

export const DOCKS: Dock[] = ['bottom', 'left', 'right']

export const GRIP_ICON_SIZE = 15

export const PLACE_ICON_SIZE = 14
