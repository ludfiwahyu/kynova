import { LayoutPanelTop } from 'lucide-react'

import { Button } from '@/components/ui/Button/Button'
import { DockOverlay } from '@/components/ui/DockGrip/components/DockOverlay'
import { useDockGrip } from '@/components/ui/DockGrip/hooks/useDockGrip'
import { GRIP_ICON_SIZE } from '@/components/ui/DockGrip/logic/config'
import type { DockGripProps } from '@/components/ui/DockGrip/types'
import { MenuItem } from '@/components/ui/Menu/components/MenuItem'
import { Menu } from '@/components/ui/Menu/Menu'

export function DockGrip(props: DockGripProps) {
    const grip = useDockGrip(props)

    return (
        <span className="contents">
            <Menu
                align="end"
                label={grip.label}
                trigger={(trigger) => (
                    <Button
                        variant="icon"
                        className="dock-grip"
                        icon={<LayoutPanelTop size={GRIP_ICON_SIZE} />}
                        aria-label={grip.label}
                        title="Drag to move, or click to choose where"
                        aria-expanded={trigger['aria-expanded']}
                        aria-haspopup={trigger['aria-haspopup']}
                        onClick={(event) => grip.handleClick(event, trigger.onClick)}
                        onPointerDown={grip.handlePointerDown}
                        onPointerMove={grip.handlePointerMove}
                        onPointerUp={grip.handlePointerUp}
                        onPointerCancel={grip.handlePointerCancel}
                    />
                )}
            >
                {grip.places.map((place) => (
                    <MenuItem
                        key={place.place}
                        icon={place.icon}
                        checked={place.checked}
                        onSelect={() => grip.onDock(place.place)}
                    >
                        {place.label}
                    </MenuItem>
                ))}
            </Menu>

            {grip.drag && (
                <DockOverlay
                    drag={grip.drag}
                    label={grip.zoneLabel}
                />
            )}
        </span>
    )
}
