import { useUi, useWorkspace, useWorkspaceId } from '@/stores'
import type { Environment } from '#shared/types.ts'

/** The environment selected in this browser, if it still exists. */
export function useActiveEnvironment(): Environment | undefined {
    const workspaceId = useWorkspaceId()
    const environmentId = useUi((state) => state.environmentByWorkspace[workspaceId])

    return useWorkspace((state) => (environmentId ? state.environments[environmentId] : undefined))
}
