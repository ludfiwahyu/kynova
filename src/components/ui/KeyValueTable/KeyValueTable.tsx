import { AlignLeft, Plus, Table2 } from 'lucide-react'

import { Button } from '@/components/ui/Button/Button'
import { BulkEditor } from '@/components/ui/KeyValueTable/components/BulkEditor'
import { KeyValueGrid } from '@/components/ui/KeyValueTable/components/KeyValueGrid'
import { useKeyValueTable } from '@/components/ui/KeyValueTable/hooks/useKeyValueTable'
import {
    ADD_ICON_SIZE,
    MODE_ICON_SIZE,
    VIEW_MODES,
} from '@/components/ui/KeyValueTable/logic/config'
import type { KeyValueTableProps } from '@/components/ui/KeyValueTable/types'

export function KeyValueTable({
    rows,
    onChange,
    disabled,
    variables,
    keyLabel = 'Key',
    fixedKeys = false,
    description = true,
    addLabel,
}: KeyValueTableProps) {
    const table = useKeyValueTable({
        rows,
        onChange,
        disabled,
        keyLabel,
        fixedKeys,
    })

    return (
        <div
            ref={table.rootRef}
            className="kv-root"
        >
            <div className="kv-bar">
                <p className="kv-hint">
                    {table.mode === 'bulk' && (
                        <>
                            One <code>key:value</code> per line. <code>//</code> at the start
                            switches a line off:{' '}
                            {table.toggleKeys.map((key) => (
                                <kbd key={key}>{key}</kbd>
                            ))}
                            .
                        </>
                    )}
                </p>

                <div
                    className="segmented kv-modes"
                    role="radiogroup"
                    aria-label="Edit as"
                >
                    {VIEW_MODES.map((option) => (
                        <Button
                            key={option.mode}
                            variant="plain"
                            role="radio"
                            aria-checked={table.mode === option.mode}
                            disabled={table.keyLocked}
                            icon={
                                option.mode === 'table' ? (
                                    <Table2 size={MODE_ICON_SIZE} />
                                ) : (
                                    <AlignLeft size={MODE_ICON_SIZE} />
                                )
                            }
                            onClick={() => table.setMode(option.mode)}
                        >
                            {option.label}
                        </Button>
                    ))}
                </div>

                {addLabel && table.canAdd && (
                    <Button
                        variant="icon"
                        className="kv-add"
                        icon={<Plus size={ADD_ICON_SIZE} />}
                        aria-label={addLabel}
                        title={table.mode === 'bulk' ? 'Add a line in Bulk Edit' : addLabel}
                        disabled={table.mode === 'bulk'}
                        onClick={table.focusNewRow}
                    />
                )}
            </div>

            {table.mode === 'bulk' ? (
                <BulkEditor
                    table={table}
                    variables={variables}
                    disabled={disabled}
                />
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
