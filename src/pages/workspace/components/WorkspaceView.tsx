import { Users } from 'lucide-react'

import { Input, Tabs } from '@/components'
import { WorkspaceOverview } from '@/pages/workspace/components/WorkspaceOverview'
import { WorkspaceSettings } from '@/pages/workspace/components/WorkspaceSettings'
import { useWorkspaceView } from '@/pages/workspace/hooks/useWorkspaceView'
import { NAME_ICON_SIZE, workspacePage } from '@/pages/workspace/logic/config'
import { MAX_NAME_LENGTH } from '#shared/limits.ts'

export function WorkspaceView() {
    const view = useWorkspaceView()

    if (!view.workspace) {
        return null
    }

    return (
        <div className="document-view">
            <header className="item-header">
                <Users
                    size={NAME_ICON_SIZE}
                    className="item-icon"
                />

                <Input
                    variant="plain"
                    className="item-name"
                    aria-label="Workspace name"
                    maxLength={MAX_NAME_LENGTH}
                    size={view.nameSize}
                    value={view.nameDraft}
                    disabled={!view.isOwner}
                    onValueChange={view.setNameDraft}
                    onBlur={view.saveName}
                    onKeyDown={view.handleNameKeyDown}
                />
            </header>

            <div className="document-toolbar">
                <Tabs
                    label="Workspace"
                    tabs={workspacePage.tabs}
                    active={view.section}
                    onChange={view.changeSection}
                />
            </div>

            <div
                ref={view.bodyRef}
                className="document-body"
            >
                {view.section === 'overview' && <WorkspaceOverview workspace={view.workspace} />}
                {view.section !== 'overview' && <WorkspaceSettings workspace={view.workspace} />}
            </div>
        </div>
    )
}
