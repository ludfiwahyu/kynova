import { Button } from '@/components'
import { useSidebar } from '@/layouts/Workbench/hooks/useSidebar'
import { SIDEBAR_ICON_SIZE, SIDEBAR_ICON_STROKE } from '@/layouts/Workbench/logic/config'
import { CollectionsView } from '@/pages/collections'
import { EnvironmentsView } from '@/pages/environments'
import { HistoryView } from '@/pages/history'

export function Sidebar() {
    const sidebar = useSidebar()

    return (
        <aside className="sidebar">
            <nav
                className="sidebar-views"
                aria-label="Sidebar views"
            >
                {sidebar.views.map(({ id, label, icon: Icon }) => (
                    <Button
                        key={id}
                        variant="plain"
                        className="sidebar-view-button"
                        aria-pressed={id === sidebar.active}
                        aria-label={label}
                        title={label}
                        icon={
                            <Icon
                                size={SIDEBAR_ICON_SIZE}
                                strokeWidth={SIDEBAR_ICON_STROKE}
                            />
                        }
                        onClick={() => sidebar.choose(id)}
                    />
                ))}
            </nav>

            {sidebar.active === 'collections' && <CollectionsView />}
            {sidebar.active === 'environments' && <EnvironmentsView />}
            {sidebar.active === 'history' && <HistoryView />}
        </aside>
    )
}
