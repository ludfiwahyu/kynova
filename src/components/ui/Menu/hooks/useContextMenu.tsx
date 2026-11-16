import { type MouseEvent, type ReactNode, useRef, useState } from 'react'

import { Popover } from '@/components/ui/Menu/components/Popover'
import type { Anchor } from '@/components/ui/Menu/types'

/**
 * A menu opened by right-clicking: spread `onContextMenu` onto the element,
 * and render `menu` next to it.
 */
export function useContextMenu(render: () => ReactNode): {
    onContextMenu: (event: MouseEvent) => void
    menu: ReactNode
} {
    const [point, setPoint] = useState<Anchor | null>(null)
    const opener = useRef<Element | null>(null)

    function onContextMenu(event: MouseEvent) {
        event.preventDefault()
        event.stopPropagation()
        opener.current = event.currentTarget as Element
        setPoint({
            left: event.clientX,
            right: event.clientX,
            top: event.clientY,
            bottom: event.clientY,
        })
    }

    const menu = point && (
        <Popover
            anchor={point}
            align="start"
            onClose={() => setPoint(null)}
            opener={opener.current}
        >
            {render()}
        </Popover>
    )

    return {
        onContextMenu,
        menu,
    }
}
