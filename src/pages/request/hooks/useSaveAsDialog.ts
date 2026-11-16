import type { FormEvent } from 'react'
import { useState } from 'react'

import { toDestinations } from '@/pages/request/logic/mappers'
import type { SaveAsDialogProps } from '@/pages/request/types'
import { expand, openTab, saveRequestAs, useWorkspace } from '@/stores'

export function useSaveAsDialog({ item, onClose }: SaveAsDialogProps) {
    const items = useWorkspace((state) => state.items)

    const [name, setName] = useState(`${item.name} Copy`)
    const [parentId, setParentId] = useState(item.parentId ?? '')

    const destinations = toDestinations(items)
    const canSave = name.trim() !== '' && parentId !== ''

    function submit(event: FormEvent) {
        event.preventDefault()

        if (!canSave) {
            return
        }

        const copy = saveRequestAs(item, name.trim(), parentId)

        expand(parentId)
        openTab({
            kind: 'item',
            id: copy.id,
        })
        onClose()
    }

    return {
        name,
        parentId,
        destinations,
        canSave,
        setName,
        setParentId,
        submit,
    }
}
