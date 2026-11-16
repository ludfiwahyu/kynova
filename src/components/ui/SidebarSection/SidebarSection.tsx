import { ChevronRight } from 'lucide-react'

import { useSidebarSection } from '@/components/ui/SidebarSection/hooks/useSidebarSection'
import type { SidebarSectionProps } from '@/components/ui/SidebarSection/types'

export function SidebarSection({
    id,
    title,
    grow = false,
    actions,
    children,
}: SidebarSectionProps) {
    const section = useSidebarSection(id)

    return (
        <section
            className="sidebar-section"
            data-grow={grow}
            data-collapsed={section.isCollapsed}
        >
            <div className="sidebar-section-header">
                <button
                    type="button"
                    className="sidebar-section-toggle"
                    aria-expanded={!section.isCollapsed}
                    onClick={section.toggle}
                >
                    <ChevronRight
                        size={13}
                        className="sidebar-section-chevron"
                    />
                    {title}
                </button>

                {actions && <span className="sidebar-section-actions">{actions}</span>}
            </div>

            {!section.isCollapsed && <div className="sidebar-section-body">{children}</div>}
        </section>
    )
}
