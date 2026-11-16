import { Popover } from '@/components/ui/Menu/components/Popover'
import { useMenu } from '@/components/ui/Menu/hooks/useMenu'
import type { MenuProps } from '@/components/ui/Menu/types'

/** A menu opened by a button. */
export function Menu({ trigger, align = 'start', label, children }: MenuProps) {
    const menu = useMenu()

    return (
        <span
            ref={menu.triggerRef}
            className="menu-trigger"
        >
            {trigger(menu.triggerProps)}

            {menu.anchor && (
                <Popover
                    anchor={menu.anchor}
                    align={align}
                    onClose={menu.close}
                    label={label}
                    opener={menu.triggerRef.current}
                >
                    {children}
                </Popover>
            )}
        </span>
    )
}
