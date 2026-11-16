import { Select } from '@/components'
import { Advanced } from '@/pages/request/components/auth/Advanced'
import { AuthFieldRow } from '@/pages/request/components/auth/AuthFieldRow'
import { FieldList } from '@/pages/request/components/auth/FieldList'
import { OAuth2Editor } from '@/pages/request/components/auth/OAuth2Editor'
import { useAuthEditor } from '@/pages/request/hooks/useAuthEditor'
import type { AuthEditorProps } from '@/pages/request/types'

export function AuthEditor(props: AuthEditorProps) {
    const { itemId, auth, onChange, disabled, variables } = props
    const editor = useAuthEditor(props)

    return (
        <div className="auth-layout">
            <div className="auth-side">
                <h3 className="auth-side-title">Auth type</h3>

                <Select
                    label="Auth type"
                    value={auth.type}
                    options={editor.typeOptions}
                    disabled={disabled}
                    onChange={editor.changeType}
                />

                {editor.spec.note && <p className="auth-note">{editor.spec.note}</p>}

                {editor.sideSelects.map((field) => (
                    <div
                        key={field.key}
                        className="auth-side-field"
                    >
                        <h3 className="auth-side-title">{field.label}</h3>

                        <AuthFieldRow
                            field={field}
                            bare
                            {...editor.fieldProps}
                        />
                    </div>
                ))}

                {editor.sideNote && <p className="auth-note">{editor.sideNote}</p>}

                <FieldList
                    fields={editor.sideChecks}
                    {...editor.fieldProps}
                />
            </div>

            <div className="auth-main">
                <h2 className="auth-title">{editor.spec.label}</h2>

                {editor.isNone && (
                    <p className="auth-note">This request does not use any authorization.</p>
                )}

                {editor.oauth2 && (
                    <OAuth2Editor
                        itemId={itemId}
                        auth={editor.oauth2}
                        onChange={onChange}
                        disabled={disabled}
                        variables={variables}
                    />
                )}

                {!editor.oauth2 && (
                    <>
                        <div className="auth-rows">
                            <FieldList
                                fields={editor.mainFields}
                                {...editor.fieldProps}
                            />
                        </div>

                        {editor.hasAdvanced && (
                            <Advanced note={editor.spec.advancedNote}>
                                <FieldList
                                    fields={editor.advancedFields}
                                    {...editor.fieldProps}
                                />
                            </Advanced>
                        )}
                    </>
                )}

                {editor.showWarning && (
                    <p className="auth-note auth-warning">
                        Settings are saved with the request, so everyone in the workspace can see
                        them. Use a <code>{'{{variable}}'}</code> to keep a secret out of them.
                    </p>
                )}
            </div>
        </div>
    )
}
