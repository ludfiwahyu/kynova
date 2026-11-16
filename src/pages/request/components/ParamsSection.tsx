import { KeyValueTable } from '@/components'
import { useParamsSection } from '@/pages/request/hooks/useParamsSection'
import type { ParamsSectionProps } from '@/pages/request/types'

export function ParamsSection(props: ParamsSectionProps) {
    const { canEdit } = props
    const params = useParamsSection(props)

    return (
        <div className="contents">
            <h3 className="section-title">Query Params</h3>

            <KeyValueTable
                rows={params.params}
                disabled={!canEdit}
                variables={params.variables}
                onChange={params.changeParams}
            />

            {params.showPathVariables && (
                <>
                    <h3 className="section-title">Path Variables</h3>

                    <KeyValueTable
                        rows={params.pathVariables}
                        disabled={!canEdit}
                        variables={params.variables}
                        fixedKeys
                        onChange={params.changePathVariables}
                    />
                </>
            )}
        </div>
    )
}
