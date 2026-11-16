import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'
import type { BulkEditorProps } from '@/components/ui/KeyValueTable/types'

/** Every row as one `key:value` line, in the code editor: multi-cursor, find, ⌥Z and the rest. */
export function BulkEditor({ table, variables, disabled }: BulkEditorProps) {
    return (
        <CodeEditor
            label={table.bulkLabel}
            language="keyValue"
            value={table.bulkText}
            minRows={table.bulkRowCount}
            variables={variables}
            disabled={disabled}
            placeholder="key:value"
            onChange={table.changeBulk}
        />
    )
}
