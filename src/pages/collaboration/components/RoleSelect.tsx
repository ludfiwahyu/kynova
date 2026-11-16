import { Select } from '@/components'
import { ROLE_OPTIONS } from '@/pages/collaboration/logic/config'
import type { RoleSelectProps } from '@/pages/collaboration/types'

export function RoleSelect({ value, label, onChange }: RoleSelectProps) {
    return (
        <Select
            label={label}
            value={value}
            options={[...ROLE_OPTIONS]}
            onChange={onChange}
        />
    )
}
