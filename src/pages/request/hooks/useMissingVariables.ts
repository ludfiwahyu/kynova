import { useActiveEnvironment, useVariables } from '@/hooks'
import type { MissingVariablesProps } from '@/pages/request/types'
import { unresolvedVariables } from '@/utils'

export function useMissingVariables({ item }: MissingVariablesProps) {
    const environment = useActiveEnvironment()
    const variables = useVariables(item)

    const missing = unresolvedVariables(item.request.url, variables)
    const names = missing.map((name) => `{{${name}}}`).join(', ')
    const verb = missing.length === 1 ? 'is' : 'are'
    const where = environment
        ? `the ${environment.name} environment or the collection`
        : 'the collection, and no environment is selected'

    return {
        isEmpty: missing.length === 0,
        text: `${names} ${verb} not set in ${where}.`,
    }
}
