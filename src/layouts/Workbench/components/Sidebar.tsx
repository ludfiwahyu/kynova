import { X } from 'lucide-react'

import { Button } from '@/components'
import { useSidebar } from '@/layouts/Workbench/hooks/useSidebar'
import {
    CLOSE_PANEL_ICON_SIZE,
    SIDEBAR_ICON_SIZE,
    SIDEBAR_ICON_STROKE,
} from '@/layouts/Workbench/logic/config'
import { CollectionsView } from '@/pages/collections'
import { EnvironmentsView } from '@/pages/environments'
import { HistoryView } from '@/pages/history'

export function Sidebar() {
    const sidebar = useSidebar()

    return (
        <div className="contents">
            <nav
                className="left-rail"
                aria-label="Sidebar views"
            >
                {sidebar.views.map(({ id, label, icon: Icon }) => (
                    <Button
                        key={id}
                        variant="plain"
                        className="right-rail-button"
                        aria-pressed={sidebar.isOpen && id === sidebar.active}
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

            {sidebar.isOpen && (
                <aside
                    className="sidebar"
                    aria-label={sidebar.title}
                >
                    <div className="right-panel-header">
                        <h2>{sidebar.title}</h2>

                        <Button
                            variant="icon"
                            icon={<X size={CLOSE_PANEL_ICON_SIZE} />}
                            aria-label={sidebar.closeLabel}
                            onClick={sidebar.close}
                        />
                    </div>

                    {sidebar.active === 'collections' && <CollectionsView />}
                    {sidebar.active === 'environments' && <EnvironmentsView />}
                    {sidebar.active === 'history' && <HistoryView />}
                </aside>
            )}
        </div>
    )
}
