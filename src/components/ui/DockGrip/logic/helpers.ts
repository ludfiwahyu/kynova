import type { CSSProperties } from 'react'

import { DOCKS } from '@/components/ui/DockGrip/logic/config'
import type { Dock } from '@/stores'

export function nearestDock(rect: DOMRect, x: number, y: number): Dock {
    const fromLeft = (x - rect.left) / rect.width

    const distances: Record<Dock, number> = {
        left: fromLeft,
        right: 1 - fromLeft,
        bottom: (rect.bottom - y) / rect.height,
    }

    return DOCKS.reduce((best, dock) => (distances[dock] < distances[best] ? dock : best))
}

export function overlayStyle(rect: DOMRect): CSSProperties {
    return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
    }
}
