import { Button } from '@/components/ui/Button/Button'
import { BulkEditor } from '@/components/ui/KeyValueTable/components/BulkEditor'
import { KeyValueGrid } from '@/components/ui/KeyValueTable/components/KeyValueGrid'
import { useKeyValueTable } from '@/components/ui/KeyValueTable/hooks/useKeyValueTable'
import type { KeyValueTableProps } from '@/components/ui/KeyValueTable/types'

export function KeyValueTable({
    rows,
    onChange,
    disabled,
    variables,
    keyLabel = 'Key',
    fixedKeys = false,
    description = true,
}: KeyValueTableProps) {
    const table = useKeyValueTable({
        rows,
        onChange,
        disabled,
        keyLabel,
        fixedKeys,
    })

    return (
        <div className="kv-root">
            <div className="kv-bar">
                <span className="muted">{table.hint}</span>

                <Button
                    variant="link"
                    disabled={table.keyLocked}
                    onClick={table.toggleBulk}
                >
                    {table.toggleLabel}
                </Button>
            </div>

            {table.mode === 'bulk' ? (
                <BulkEditor table={table} />
            ) : (
                <KeyValueGrid
                    table={table}
                    variables={variables}
                    disabled={disabled}
                    keyLabel={keyLabel}
                    description={description}
                />
            )}
        </div>
    )
}
