import type { KeyboardEvent } from 'react'
import { useEffect, useState } from 'react'

import type { VariableRowProps } from '@/pages/environments/types'

export function useVariableRow({ value, onCommit }: VariableRowProps) {
    const [draft, setDraft] = useState(value)

    // Follows the stored value when it changes somewhere else.
    useEffect(() => {
        setDraft(value)
    }, [value])

    function commit() {
        if (draft !== value) {
            onCommit(draft)
        }
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') {
            event.currentTarget.blur()
        }
    }

    return {
        draft,
        setDraft,
        commit,
        handleKeyDown,
    }
}
