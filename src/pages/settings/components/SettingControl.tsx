import { Select, Switch } from '@/components'
import { NumberField } from '@/pages/settings/components/NumberField'
import { RadioChoice } from '@/pages/settings/components/RadioChoice'
import type { SettingControlProps } from '@/pages/settings/types'
import { setPreferences, usePreferences } from '@/settings'

export function SettingControl({ field }: SettingControlProps) {
    const preferences = usePreferences()

    function set(value: unknown) {
        setPreferences({ [field.key]: value })
    }

    return (
        <div className="contents">
            {field.control === 'switch' && (
                <Switch
                    label={field.label}
                    checked={preferences[field.key]}
                    onChange={set}
                />
            )}

            {field.control === 'number' && (
                <NumberField
                    label={field.fieldLabel}
                    unit={field.unit}
                    min={field.min}
                    max={field.max}
                    value={preferences[field.key]}
                    onChange={set}
                />
            )}

            {field.control === 'select' && (
                <Select
                    label={field.label}
                    value={preferences[field.key]}
                    options={field.options}
                    onChange={set}
                />
            )}

            {field.control === 'radio' && (
                <RadioChoice
                    name={field.label}
                    value={preferences[field.key]}
                    options={field.options}
                    onChange={set}
                />
            )}
        </div>
    )
}
