import { CodeEditor, CopyButton, Select } from '@/components'
import { useCodeSnippet } from '@/pages/request/hooks/useCodeSnippet'
import type { CodeSnippetProps } from '@/pages/request/types'

export function CodeSnippet(props: CodeSnippetProps) {
    const snippet = useCodeSnippet(props)

    return (
        <div className="side-panel-body">
            <div className="row">
                <Select
                    className="grow"
                    label="Snippet language"
                    value={snippet.language}
                    options={snippet.options}
                    onChange={snippet.setLanguage}
                />

                <CopyButton text={snippet.snippet} />
            </div>

            <div className="snippet">
                <CodeEditor
                    label="Code snippet"
                    value={snippet.snippet}
                    language={snippet.editorLanguage}
                    readOnly
                    fill
                    onChange={snippet.ignoreEdit}
                />
            </div>
        </div>
    )
}
