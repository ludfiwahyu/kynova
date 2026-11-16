import { menuItemRole } from '@/components/ui/Menu/logic/helpers'
import type { MenuItemProps } from '@/components/ui/Menu/types'

export function MenuItem({
    onSelect,
    icon,
    danger,
    disabled,
    checked,
    toggle,
    hint,
    children,
}: MenuItemProps) {
    return (
        <button
            type="button"
            role={menuItemRole(checked, toggle)}
            aria-checked={checked}
            aria-disabled={disabled}
            tabIndex={-1}
            className={danger ? 'menu-item danger' : 'menu-item'}
            onClick={(event) => {
                if (disabled) {
                    event.stopPropagation()

                    return
                }

                onSelect()
            }}
        >
            {icon && <span className="menu-icon">{icon}</span>}
            <span className="grow truncate">{children}</span>
            {hint && <kbd className="menu-hint">{hint}</kbd>}
        </button>
    )
}
