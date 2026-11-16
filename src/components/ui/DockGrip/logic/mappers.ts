import { createElement } from 'react'

import { DOCKS, ICONS, PLACE_ICON_SIZE } from '@/components/ui/DockGrip/logic/config'
import type { DockPlace } from '@/components/ui/DockGrip/types'
import type { Dock } from '@/stores'

export function toDockPlaces(dock: Dock, labels: Record<Dock, string>): DockPlace[] {
    return DOCKS.map((place) => ({
        place,
        label: labels[place],
        checked: place === dock,
        icon: createElement(ICONS[place], { size: PLACE_ICON_SIZE }),
    }))
}
