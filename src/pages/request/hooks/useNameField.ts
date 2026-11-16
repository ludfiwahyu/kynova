import type { KeyboardEvent } from 'react'
import { useEffect, useRef, useState } from 'react'

import { MIN_NAME_SIZE, NAME_SIZE_PADDING } from '@/pages/request/logic/config'
import type { NameFieldProps } from '@/pages/request/types'
import { nameEdited, renameItem, useCanEdit, useUi } from '@/stores'

export function useNameField({ item }: NameFieldProps) {
    const canEdit = useCanEdit()
    const isNew = useUi((state) => state.editNameOf === item.id)

    const [draft, setDraft] = useState(item.name)
    const ref = useRef<HTMLInputElement>(null)

    const size = Math.max(draft.length + NAME_SIZE_PADDING, MIN_NAME_SIZE)

    // A new item's name opens selected.
    useEffect(() => {
        if (!isNew) {
            return
        }

        ref.current?.focus()
        ref.current?.select()
        nameEdited()
    }, [isNew])

    function commit() {
        renameItem(item, draft)

        if (!draft.trim()) {
            setDraft(item.name)
        }
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') {
            event.currentTarget.blur()
        }

        if (event.key === 'Escape') {
            const input = event.currentTarget

            setDraft(item.name)
            requestAnimationFrame(() => input.blur())
        }
    }

    return {
        canEdit,
        draft,
        ref,
        size,
        setDraft,
        commit,
        handleKeyDown,
    }
}
