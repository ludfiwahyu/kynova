import type { SidebarSectionProps } from '@/components/ui/SidebarSection/types'
import { toggleSection, useUi } from '@/stores'

export function useSidebarSection(id: SidebarSectionProps['id']) {
    const isCollapsed = useUi((state) => state.collapsedSections[id] ?? false)

    function toggle() {
        toggleSection(id)
    }

    return {
        isCollapsed,
        toggle,
    }
}
