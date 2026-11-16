import { SIDEBAR_VIEWS } from '@/layouts/Workbench/logic/config'
import type { SidebarView } from '@/stores'
import { setSidebar, useUi, useWorkspaceSettings } from '@/stores'

export function useSidebar() {
    const chosen = useUi((state) => state.sidebar)
    const { panels } = useWorkspaceSettings()

    // The owner can switch panels off for everyone; Collections always stays.
    const views = SIDEBAR_VIEWS.filter(({ id }) => id === 'collections' || panels?.[id] !== false)
    const active: SidebarView = views.some(({ id }) => id === chosen) ? chosen : 'collections'

    return {
        views,
        active,
        choose: setSidebar,
    }
}
