import { useVariables } from '@/hooks'
import type { ParamsSectionProps } from '@/pages/request/types'
import { updateRequest } from '@/stores'
import { pathVariableNames } from '@/utils'
import type { KeyValue } from '#shared/types.ts'

export function useParamsSection({ item }: ParamsSectionProps) {
    const variables = useVariables(item)
    const { request } = item

    const pathVariables = request.pathVariables ?? []
    const showPathVariables = pathVariables.length > 0 || pathVariableNames(request.url).length > 0

    function changeParams(params: KeyValue[]) {
        updateRequest(item, { params })
    }

    function changePathVariables(next: KeyValue[]) {
        updateRequest(item, { pathVariables: next })
    }

    return {
        variables,
        params: request.params,
        pathVariables,
        showPathVariables,
        changeParams,
        changePathVariables,
    }
}
