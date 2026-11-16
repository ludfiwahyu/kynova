import { Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/Button/Button'
import type { KeyValueRowProps } from '@/components/ui/KeyValueTable/types'
import { VariableInput } from '@/components/ui/VariableInput/VariableInput'

export function KeyValueRow({
    view,
    variables,
    disabled,
    keyLocked,
    description,
    onUpdate,
    onRemove,
}: KeyValueRowProps) {
    const { row, labels, placeholders } = view

    return (
        <tr data-off={view.isOff}>
            <td>
                {view.canToggle && (
                    <input
                        type="checkbox"
                        aria-label={labels.toggle}
                        checked={row.enabled}
                        disabled={disabled}
                        onChange={(event) => onUpdate(row, { enabled: event.target.checked })}
                    />
                )}
            </td>

            <td>
                <VariableInput
                    className="kv-cell"
                    aria-label={labels.key}
                    placeholder={placeholders.key}
                    value={row.key}
                    variables={variables}
                    disabled={keyLocked}
                    onChange={(key) => onUpdate(row, { key })}
                />
            </td>

            <td>
                <VariableInput
                    className="kv-cell"
                    aria-label={labels.value}
                    placeholder={placeholders.value}
                    value={row.value}
                    variables={variables}
                    disabled={disabled}
                    onChange={(value) => onUpdate(row, { value })}
                />
            </td>

            {description && (
                <td>
                    <input
                        className="kv-description"
                        aria-label={labels.description}
                        placeholder={placeholders.description}
                        value={view.description}
                        disabled={disabled}
                        onChange={(event) => onUpdate(row, { description: event.target.value })}
                    />
                </td>
            )}

            <td>
                {view.canRemove && (
                    <Button
                        variant="icon"
                        className="kv-remove"
                        aria-label={labels.remove}
                        icon={<Trash2 size={14} />}
                        onClick={() => onRemove(row)}
                    />
                )}
            </td>
        </tr>
    )
}
