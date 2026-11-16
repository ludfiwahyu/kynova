import { Plus } from 'lucide-react'

import { Button, SidebarToolbar } from '@/components'
import { EnvironmentList } from '@/pages/environments/components/EnvironmentList'
import { useEnvironmentsView } from '@/pages/environments/hooks/useEnvironmentsView'
import { TOOLBAR_ICON_SIZE } from '@/pages/environments/logic/config'

export function EnvironmentsView() {
    const view = useEnvironmentsView()

    return (
        <div className="sidebar-body">
            <SidebarToolbar title="Environments">
                <Button
                    variant="icon"
                    icon={<Plus size={TOOLBAR_ICON_SIZE} />}
                    title="New environment"
                    aria-label="New environment"
                    disabled={!view.canEdit}
                    onClick={view.create}
                />
            </SidebarToolbar>

            <div className="sidebar-scroll">
                <EnvironmentList />
            </div>
        </div>
    )
}
