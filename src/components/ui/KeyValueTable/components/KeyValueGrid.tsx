import { KeyValueRow } from '@/components/ui/KeyValueTable/components/KeyValueRow'
import { COLUMNS } from '@/components/ui/KeyValueTable/logic/config'
import type { KeyValueViewProps } from '@/components/ui/KeyValueTable/types'

export function KeyValueGrid({
    table,
    variables,
    disabled,
    keyLabel,
    description,
}: KeyValueViewProps) {
    return (
        <table
            className="kv"
            data-description={description}
        >
            <colgroup>
                <col className="kv-check" />
                <col className="kv-key" />
                <col className="kv-value" />
                {description && <col />}
                <col className="kv-actions" />
            </colgroup>

            <thead>
                <tr>
                    <th aria-label="Enabled" />
                    <th>{keyLabel}</th>
                    <th>{COLUMNS.value}</th>
                    {description && <th>{COLUMNS.description}</th>}
                    <th />
                </tr>
            </thead>

            <tbody>
                {table.rowViews.map((view) => (
                    <KeyValueRow
                        key={view.row.id}
                        view={view}
                        variables={variables}
                        disabled={disabled}
                        keyLocked={table.keyLocked}
                        description={description}
                        onUpdate={table.update}
                        onRemove={table.remove}
                    />
                ))}
            </tbody>
        </table>
    )
}
