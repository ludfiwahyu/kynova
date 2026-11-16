import type { BulkEditorProps } from '@/components/ui/KeyValueTable/types'

export function BulkEditor({ table }: BulkEditorProps) {
    return (
        <textarea
            className="textarea code"
            aria-label={table.bulkLabel}
            spellCheck={false}
            rows={table.bulkRowCount}
            value={table.bulkText}
            onChange={(event) => table.changeBulk(event.target.value)}
        />
    )
}
