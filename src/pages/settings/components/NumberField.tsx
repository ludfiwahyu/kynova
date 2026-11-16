import { Input } from '@/components'
import { useNumberField } from '@/pages/settings/hooks/useNumberField'
import type { NumberFieldProps } from '@/pages/settings/types'

export function NumberField(props: NumberFieldProps) {
    const { value, unit, label, max } = props
    const field = useNumberField(props)

    return (
        <div className="input-group number-field">
            <Input
                variant="plain"
                className="input-group-field"
                type="number"
                inputMode="numeric"
                aria-label={label}
                min={field.min}
                max={max}
                value={value}
                onChange={field.handleChange}
            />

            {unit && <span className="number-field-unit">{unit}</span>}
        </div>
    )
}
