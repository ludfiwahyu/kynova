import type { CSSProperties } from 'react'

import { useCodeMirror } from '@/components/ui/CodeEditor/hooks/useCodeMirror'
import { DEFAULT_ROWS } from '@/components/ui/CodeEditor/logic/config'
import { codeAreaClass } from '@/components/ui/CodeEditor/logic/helpers'
import type { CodeEditorProps } from '@/components/ui/CodeEditor/types'

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

    return (
        <div
            ref={editor.hostRef}
            className={codeAreaClass(fill)}
            data-disabled={disabled}
            style={{ '--rows': minRows } as CSSProperties}
        />
    )
}
