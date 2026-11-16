import { Select } from '@/components'
import { useEnvironmentSelect } from '@/pages/environments/hooks/useEnvironmentSelect'

export function EnvironmentSelect() {
    const select = useEnvironmentSelect()

    return (
        <Select
            className="environment-select"
            variant="quiet"
            label="Active environment"
            value={select.value}
            options={select.options}
            onChange={select.choose}
        />
    )
}
