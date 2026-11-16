import { CodeEditor, Select, VariableInput } from '@/components'
import type { AuthControlProps } from '@/pages/request/types'

export function AuthControl({ row, field, disabled, variables }: AuthControlProps) {
    return (
        <div className="contents">
            {row.isSelect && (
                <Select
                    label={field.label}
                    value={row.selectValue}
                    options={field.options ?? []}
                    disabled={disabled}
                    onChange={row.chooseOption}
                />
            )}

            {row.isCode && (
                <CodeEditor
                    label={field.label}
                    value={row.codeValue}
                    placeholder={row.codePlaceholder}
                    disabled={disabled}
                    minRows={row.codeRows}
                    language={row.codeLanguage}
                    variables={field.kind === 'code' ? variables : undefined}
                    onChange={row.changeText}
                />
            )}

            {row.isText && (
                <VariableInput
                    id={row.id}
                    className="auth-input"
                    aria-label={field.label}
                    placeholder={field.placeholder}
                    value={row.textValue}
                    variables={variables}
                    disabled={disabled}
                    onChange={row.changeText}
                />
            )}
        </div>
    )
}
