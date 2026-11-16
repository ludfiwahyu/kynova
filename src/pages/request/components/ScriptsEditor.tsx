import { Button, CodeEditor } from '@/components'
import { useScriptsEditor } from '@/pages/request/hooks/useScriptsEditor'
import { SCRIPT_MIN_ROWS, SCRIPTS_NOTE } from '@/pages/request/logic/config'
import type { ScriptsEditorProps } from '@/pages/request/types'

export function ScriptsEditor(props: ScriptsEditorProps) {
    const { disabled, fill = false } = props
    const editor = useScriptsEditor(props)

    return (
        <div className="scripts-editor">
            <div
                className="scripts-phases"
                role="tablist"
                aria-label="Script phase"
            >
                {editor.tabs.map((tab) => (
                    <Button
                        key={tab.id}
                        variant="plain"
                        role="tab"
                        aria-selected={tab.id === editor.phase}
                        onClick={() => editor.setPhase(tab.id)}
                    >
                        {tab.label}

                        {tab.hasScript && (
                            <span
                                className="tab-dot"
                                aria-label="has a script"
                            />
                        )}
                    </Button>
                ))}
            </div>

            <div className="scripts-body">
                <CodeEditor
                    key={editor.phase}
                    label={editor.editorLabel}
                    value={editor.value}
                    placeholder={editor.placeholder}
                    disabled={disabled}
                    minRows={SCRIPT_MIN_ROWS}
                    fill={fill}
                    language="javascript"
                    onChange={editor.change}
                />

                <p className="scripts-note muted">{SCRIPTS_NOTE}</p>
            </div>
        </div>
    )
}
