import { SIDEBAR_VIEWS } from '@/layouts/Workbench/logic/config'
import type { SidebarView } from '@/stores'
import { setSidebar, toggleSidebarOpen, useUi, useWorkspaceSettings } from '@/stores'

export function useSidebar() {
    const chosen = useUi((state) => state.sidebar)
    const isOpen = useUi((state) => state.layout.sidebarOpen)
    const { panels } = useWorkspaceSettings()

    // The owner can switch panels off for everyone; Collections always stays.
    const views = SIDEBAR_VIEWS.filter(({ id }) => id === 'collections' || panels?.[id] !== false)
    const active: SidebarView = views.some(({ id }) => id === chosen) ? chosen : 'collections'
    const title = views.find(({ id }) => id === active)?.label

    // The open view's own button minimizes the sidebar, as on the right side.
    function choose(view: SidebarView) {
        if (isOpen && view === active) {
            toggleSidebarOpen()
        } else {
            setSidebar(view)
        }
    }

    return {
        views,
        active,
        isOpen,
        title,
        closeLabel: `Close ${title}`,
        choose,
        close: toggleSidebarOpen,
    }
}
