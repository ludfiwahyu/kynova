import { AuthFieldRow } from '@/pages/request/components/auth/AuthFieldRow'
import { visibleFields } from '@/pages/request/logic/helpers'
import type { FieldListProps } from '@/pages/request/types'

export function FieldList({ fields, ...props }: FieldListProps) {
    const shown = visibleFields(fields, props.values, props.defaults)

    return (
        <div className="contents">
            {shown.map((field) => (
                <AuthFieldRow
                    key={field.key}
                    field={field}
                    {...props}
                />
            ))}
        </div>
    )
}
