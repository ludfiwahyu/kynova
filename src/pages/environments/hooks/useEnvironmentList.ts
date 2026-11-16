import { newEnvironment, sortedByName } from '@/pages/environments/logic/helpers'
import { useCanEdit, useWorkspace } from '@/stores'

export function useEnvironmentList() {
    const environments = useWorkspace((state) => state.environments)
    const canEdit = useCanEdit()

    const sorted = sortedByName(environments)
    const isEmpty = sorted.length === 0

    return {
        environments: sorted,
        isEmpty,
        canEdit,
        create: newEnvironment,
    }
}
