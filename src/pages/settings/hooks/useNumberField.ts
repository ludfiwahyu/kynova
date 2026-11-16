import type { ChangeEvent } from 'react'

import { parseWhole } from '@/pages/settings/logic/helpers'
import type { NumberFieldProps } from '@/pages/settings/types'

export function useNumberField({ onChange, min = 0, max }: NumberFieldProps) {
    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const next = parseWhole(event.target.value, min, max)

        if (next !== null) {
            onChange(next)
        }
    }

    return {
        min,
        handleChange,
    }
}
