import { Input } from '@/components'
import { AuthControl } from '@/pages/request/components/auth/AuthControl'
import { InfoMark } from '@/pages/request/components/auth/InfoMark'
import { useAuthFieldRow } from '@/pages/request/hooks/useAuthFieldRow'
import type { AuthFieldRowProps } from '@/pages/request/types'

export function AuthFieldRow(props: AuthFieldRowProps) {
    const { field, disabled, variables, bare = false } = props
    const row = useAuthFieldRow(props)

    return (
        <div className="contents">
            {row.isCheck && (
                <div className="auth-row auth-row-check">
                    <label className="auth-check">
                        <Input
                            variant="plain"
                            id={row.id}
                            type="checkbox"
                            checked={row.checked}
                            disabled={disabled}
                            onChange={row.toggleCheck}
                        />
                        {field.label}
                    </label>

                    {field.info && <InfoMark text={field.info} />}
                </div>
            )}

            {!row.isCheck && bare && (
                <AuthControl
                    row={row}
                    field={field}
                    disabled={disabled}
                    variables={variables}
                />
            )}

            {!row.isCheck && !bare && (
                <div className="auth-row">
                    <span className="auth-label">
                        {row.isText ? (
                            <label htmlFor={row.id}>{field.label}</label>
                        ) : (
                            <span>{field.label}</span>
                        )}

                        {field.info && <InfoMark text={field.info} />}
                    </span>

                    <div className="auth-control">
                        <AuthControl
                            row={row}
                            field={field}
                            disabled={disabled}
                            variables={variables}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
