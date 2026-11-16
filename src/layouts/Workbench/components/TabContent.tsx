import { LibraryBig } from 'lucide-react'

import { Button, EmptyState } from '@/components'
import { useTabContent } from '@/layouts/Workbench/hooks/useTabContent'
import { EMPTY_ICON_SIZE, EMPTY_ICON_STROKE } from '@/layouts/Workbench/logic/config'
import { ContainerView } from '@/pages/container'
import { EnvironmentView } from '@/pages/environments'
import { RequestView } from '@/pages/request'
import { WorkspaceView } from '@/pages/workspace'

export function TabContent() {
    const tab = useTabContent()

    return (
        <div
            ref={tab.bodyRef}
            className="tab-body"
            data-dropping={tab.explorerDrop.isOver || undefined}
            onDragOverCapture={tab.explorerDrop.dragOver}
            onDragLeave={tab.explorerDrop.dragLeave}
            onDropCapture={tab.explorerDrop.drop}
        >
            {tab.requestItem && (
                <RequestView
                    key={tab.requestItem.id}
                    item={tab.requestItem}
                />
            )}

            {tab.containerItem && (
                <ContainerView
                    key={tab.containerItem.id}
                    item={tab.containerItem}
                />
            )}

            {tab.environment && (
                <EnvironmentView
                    key={tab.environment.id}
                    environment={tab.environment}
                />
            )}

            {tab.workspaceTab && <WorkspaceView key={tab.workspaceTab.id} />}

            {tab.showEmpty && (
                <EmptyState
                    icon={
                        <LibraryBig
                            size={EMPTY_ICON_SIZE}
                            strokeWidth={EMPTY_ICON_STROKE}
                        />
                    }
                    title="Nothing is open"
                    className="tab-empty"
                    action={
                        tab.canEdit && <Button onClick={tab.newCollection}>New collection</Button>
                    }
                >
                    Open a request from the sidebar, find one with ⌘K, or start a new collection.
                </EmptyState>
            )}
        </div>
    )
}
