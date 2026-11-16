import { Button, CodeEditor, KeyValueTable, Radio, Select } from '@/components'
import { JsonStyleMenu } from '@/pages/request/components/JsonStyleMenu'
import { useBodyEditor } from '@/pages/request/hooks/useBodyEditor'
import type { BodyEditorProps } from '@/pages/request/types'

export function BodyEditor(props: BodyEditorProps) {
    const { body, disabled, variables } = props
    const editor = useBodyEditor(props)

    return (
        <div className="body-editor">
            <div
                className="body-types"
                role="radiogroup"
                aria-label="Body type"
            >
                {editor.types.map(({ id, label }) => (
                    <Radio
                        key={id}
                        name="body-type"
                        label={label}
                        checked={body.type === id}
                        disabled={disabled}
                        onChange={() => editor.changeType(id)}
                    />
                ))}

                {editor.isRaw && (
                    <>
                        <Select
                            variant="quiet"
                            label="Body language"
                            value={editor.rawLanguage}
                            options={editor.languageOptions}
                            disabled={disabled}
                            onChange={editor.changeLanguage}
                        />

                        <span className="grow" />

                        {editor.isJson && (
                            <>
                                <Button
                                    variant="link"
                                    disabled={disabled}
                                    onClick={editor.beautify}
                                >
                                    Beautify
                                </Button>

                                <JsonStyleMenu editorSettings />
                            </>
                        )}
                    </>
                )}
            </div>

            {editor.isNone && <p className="muted body-none">This request does not have a body.</p>}

            {editor.isRaw && (
                <CodeEditor
                    label="Request body"
                    value={editor.editorValue}
                    disabled={disabled}
                    placeholder={editor.editorPlaceholder}
                    language={editor.editorLanguage}
                    variables={variables}
                    fill
                    onBlur={editor.blurHandler}
                    onChange={editor.changeEditor}
                />
            )}

            {editor.isUrlencoded && (
                <KeyValueTable
                    rows={editor.fields}
                    disabled={disabled}
                    variables={variables}
                    onChange={editor.changeFields}
                />
            )}
        </div>
    )
}
