import { Radio } from '@/components'
import type { RadioChoiceProps } from '@/pages/settings/types'

export function RadioChoice<T extends string>({
    name,
    value,
    options,
    onChange,
}: RadioChoiceProps<T>) {
    return (
        <div
            className="radio-choice"
            role="radiogroup"
            aria-label={name}
        >
            {options.map((option) => (
                <Radio
                    key={option.value}
                    name={name}
                    label={option.label}
                    checked={value === option.value}
                    onChange={() => onChange(option.value)}
                />
            ))}
        </div>
    )
}
