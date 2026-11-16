import { type CSSProperties, Suspense } from 'react'

import { DEFAULT_ROWS } from '@/components/ui/CodeEditor/logic/config'
import { codeAreaClass } from '@/components/ui/CodeEditor/logic/helpers'
import { CodeMirrorView } from '@/components/ui/CodeEditor/logic/lazyView'
import type { CodeEditorProps } from '@/components/ui/CodeEditor/types'

/** The code editor for bodies, scripts and auth payloads. A box of the same size stands in while it loads. */
export function CodeEditor(props: CodeEditorProps) {
    return (
        <Suspense
            fallback={
                <div
                    className={codeAreaClass(props.fill ?? false)}
                    aria-busy="true"
                    style={{ '--rows': props.minRows ?? DEFAULT_ROWS } as CSSProperties}
                />
            }
        >
            <CodeMirrorView {...props} />
        </Suspense>
    )
}
