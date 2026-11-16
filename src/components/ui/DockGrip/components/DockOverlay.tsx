import { createPortal } from 'react-dom'

import { ICONS, PLACE_ICON_SIZE } from '@/components/ui/DockGrip/logic/config'
import { overlayStyle } from '@/components/ui/DockGrip/logic/helpers'
import type { DockOverlayProps } from '@/components/ui/DockGrip/types'

export function DockOverlay({ drag, label }: DockOverlayProps) {
    const Icon = ICONS[drag.zone]

    return createPortal(
        <div
            className="dock-overlay"
            aria-hidden="true"
            style={overlayStyle(drag.rect)}
        >
            <div
                className="dock-preview"
                data-zone={drag.zone}
            >
                <span className="dock-preview-label">
                    <Icon size={PLACE_ICON_SIZE} /> {label}
                </span>
            </div>
        </div>,
        document.body,
    )
}
