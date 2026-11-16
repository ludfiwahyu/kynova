import { confirm } from '@/components'
import { useWorkspaceTheme } from '@/pages/workspace/hooks/useWorkspaceTheme'
import { toPanelViews, toThemeOptions } from '@/pages/workspace/logic/mappers'
import type { WorkspaceSectionProps } from '@/pages/workspace/types'
import { deleteWorkspace, leaveWorkspace } from '@/stores'

export function useWorkspaceSettingsSection({ workspace }: WorkspaceSectionProps) {
    const isOwner = workspace.role === 'owner'
    const theme = useWorkspaceTheme(isOwner)

    const panels = toPanelViews(theme.saved, isOwner)

    async function confirmDelete() {
        const confirmed = await confirm({
            title: `Delete ${workspace.name}?`,
            message:
                'Its collections, environments and comments are deleted for every member. This cannot be undone.',
            action: 'Delete workspace',
        })

        if (confirmed) {
            await deleteWorkspace(workspace.id)
        }
    }

    async function confirmLeave() {
        const confirmed = await confirm({
            title: `Leave ${workspace.name}?`,
            message: 'You will need a new invite link to come back.',
            action: 'Leave workspace',
        })

        if (confirmed) {
            await leaveWorkspace(workspace.id)
        }
    }

    function remove() {
        void confirmDelete()
    }

    function leave() {
        void confirmLeave()
    }

    return {
        isOwner,
        theme,
        panels,
        themeOptions: toThemeOptions(),
        remove,
        leave,
    }
}
