import { Trash2 } from 'lucide-react'

import { Button, Input, Select } from '@/components'
import { useParamTable } from '@/pages/request/hooks/useParamTable'
import { AUTH_ICON_SIZE, SEND_IN } from '@/pages/request/logic/config'
import type { ParamTableProps } from '@/pages/request/types'

export function ParamTable(props: ParamTableProps) {
    const { sendIn, disabled, label } = props
    const table = useParamTable(props)

    return (
        <table
            className="auth-params"
            aria-label={label}
        >
            <thead>
                <tr>
                    <th scope="col">Key</th>
                    <th scope="col">Value</th>
                    {sendIn && <th scope="col">Send In</th>}
                    <th
                        scope="col"
                        aria-label="Actions"
                    />
                </tr>
            </thead>

            <tbody>
                {table.all.map((row, index) => (
                    <tr key={index}>
                        <td>
                            <Input
                                variant="plain"
                                className="auth-param-input"
                                aria-label={`${label} key`}
                                placeholder={table.isExisting(index) ? '' : 'Create parameter'}
                                value={row.key}
                                disabled={disabled}
                                onValueChange={(key) => table.update(index, { key })}
                            />
                        </td>

                        <td>
                            <Input
                                variant="plain"
                                className="auth-param-input"
                                aria-label={`${label} value`}
                                placeholder={table.isExisting(index) ? '' : 'Value'}
                                value={row.value}
                                disabled={disabled}
                                onValueChange={(value) => table.update(index, { value })}
                            />
                        </td>

                        {sendIn && (
                            <td>
                                {table.isExisting(index) && (
                                    <Select
                                        variant="quiet"
                                        label={`Send ${row.key} in`}
                                        value={row.send_as ?? 'request_body'}
                                        options={SEND_IN}
                                        disabled={disabled}
                                        onChange={(send_as) => table.update(index, { send_as })}
                                    />
                                )}
                            </td>
                        )}

                        <td>
                            {table.isExisting(index) && !disabled && (
                                <Button
                                    variant="icon"
                                    icon={<Trash2 size={AUTH_ICON_SIZE} />}
                                    aria-label={`Delete ${row.key || 'parameter'}`}
                                    onClick={() => table.remove(index)}
                                />
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
