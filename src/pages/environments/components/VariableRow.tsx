import { Input, ScopeBadge } from '@/components'
import { useVariableRow } from '@/pages/environments/hooks/useVariableRow'
import type { VariableRowProps } from '@/pages/environments/types'

export function VariableRow(props: VariableRowProps) {
    const { name, scope, disabled } = props
    const row = useVariableRow(props)

    return (
        <div className="variable-row">
            <span className="variable-name">
                <ScopeBadge scope={scope} />
                <span className="truncate">{name}</span>
            </span>

            <Input
                variant="code"
                className="variable-value"
                aria-label={`Value of ${name}`}
                placeholder="Enter value"
                spellCheck={false}
                value={row.draft}
                disabled={disabled}
                onValueChange={row.setDraft}
                onBlur={row.commit}
                onKeyDown={row.handleKeyDown}
            />
        </div>
    )
}
