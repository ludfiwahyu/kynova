import { useState } from 'react'

import { confirm } from '@/components'
import { toWorkspaceLines } from '@/layouts/Workbench/logic/mappers'
import type { WorkspaceDialog } from '@/layouts/Workbench/types'
import {
    createWorkspace,
    deleteWorkspace,
    leaveWorkspace,
    openWorkspaceTab,
    renameWorkspace,
    selectWorkspace,
    useActiveWorkspace,
    useSession,
} from '@/stores'

export function useWorkspaceMenu() {
    const workspaces = useSession((state) => state.workspaces)
    const active = useActiveWorkspace()
    const [dialog, setDialog] = useState<WorkspaceDialog>(null)

    const lines = active ? toWorkspaceLines(workspaces, active.id) : []
    const isOwner = active?.role === 'owner'

    async function confirmDelete() {
        if (!active) {
            return
        }

        const confirmed = await confirm({
            title: `Delete ${active.name}?`,
            message:
                'Its collections, environments and comments are deleted for every member. This cannot be undone.',
            action: 'Delete workspace',
        })

        if (confirmed) {
            await deleteWorkspace(active.id)
        }
    }

    async function confirmLeave() {
        if (!active) {
            return
        }

        const confirmed = await confirm({
            title: `Leave ${active.name}?`,
            message: 'You will need a new invite link to come back.',
            action: 'Leave workspace',
        })

        if (confirmed) {
            await leaveWorkspace(active.id)
        }
    }

    function openOverview() {
        if (active) {
            openWorkspaceTab(active.id, 'overview')
        }
    }

    function openSettings() {
        if (active) {
            openWorkspaceTab(active.id, 'settings')
        }
    }

    function rename(name: string) {
        return active ? renameWorkspace(active.id, name) : Promise.resolve()
    }

    return {
        active,
        lines,
        isOwner,
        dialog,
        select: selectWorkspace,
        create: createWorkspace,
        rename,
        openOverview,
        openSettings,
        openCreate: () => setDialog('create'),
        openRename: () => setDialog('rename'),
        closeDialog: () => setDialog(null),
        remove: () => void confirmDelete(),
        leave: () => void confirmLeave(),
    }
}
