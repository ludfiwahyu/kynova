import type { SidebarToolbarProps } from '@/components/ui/SidebarToolbar/types'

export function SidebarToolbar({ title, children }: SidebarToolbarProps) {
    return (
        <div className="sidebar-toolbar">
            {title && <h2 className="sidebar-title">{title}</h2>}
            {children}
        </div>
    )
}
