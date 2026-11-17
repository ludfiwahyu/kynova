import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'

import { useCodeMirror } from '@/components/ui/CodeEditor/hooks/useCodeMirror'
import { useVariableHover } from '@/components/ui/CodeEditor/hooks/useVariableHover'
import { DEFAULT_ROWS } from '@/components/ui/CodeEditor/logic/config'
import { codeAreaClass } from '@/components/ui/CodeEditor/logic/helpers'
import type { CodeEditorProps } from '@/components/ui/CodeEditor/types'
import { VariableDetails } from '@/components/ui/VariableInput/components/VariableDetails'

export default function CodeMirrorView({
    minRows = DEFAULT_ROWS,
    fill = false,
    disabled = false,
    ...options
}: CodeEditorProps) {
    const editor = useCodeMirror({
        ...options,
        disabled,
    })
    const variable = useVariableHover(editor.viewRef, options.variables)

    return (
        <div
            ref={editor.hostRef}
            className={codeAreaClass(fill)}
            data-disabled={disabled}
            style={{ '--rows': minRows } as CSSProperties}
        >
            {variable.hovered &&
                createPortal(
                    <VariableDetails
                        key={variable.hovered.start}
                        name={variable.hovered.name}
                        entry={variable.entry}
                        environmentName={variable.environmentName}
                        onSave={variable.onSave}
                        revealHint={variable.revealHint}
                        position={{
                            left: variable.hovered.left,
                            top: variable.hovered.top,
                        }}
                        onPointerEnter={variable.keep}
                        onPointerLeave={variable.close}
                    />,
                    variable.container,
                )}
        </div>
    )
}
