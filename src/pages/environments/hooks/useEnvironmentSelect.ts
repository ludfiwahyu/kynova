import { useActiveEnvironment } from '@/hooks'
import { sortedByName } from '@/pages/environments/logic/helpers'
import { toEnvironmentOptions } from '@/pages/environments/logic/mappers'
import { selectEnvironment, useWorkspace, useWorkspaceId } from '@/stores'

export function useEnvironmentSelect() {
    const workspaceId = useWorkspaceId()
    const environments = useWorkspace((state) => state.environments)
    const active = useActiveEnvironment()

    const options = toEnvironmentOptions(sortedByName(environments))
    const value = active?.id ?? ''

    function choose(id: string) {
        selectEnvironment(workspaceId, id || null)
    }

    return {
        options,
        value,
        choose,
    }
}
