import { useState } from 'react'

import {
    DESCRIPTION_ROW_PADDING,
    MAX_DESCRIPTION_ROWS,
    MIN_DESCRIPTION_ROWS,
} from '@/pages/container/logic/config'
import { descriptionRows } from '@/pages/container/logic/helpers'
import type { DescriptionEditorProps, DescriptionMode } from '@/pages/container/types'

export function useDescriptionEditor({ description }: DescriptionEditorProps) {
    const [isEditing, setIsEditing] = useState(false)

    const text = description ?? ''
    const isBlank = text.trim() === ''
    const rows = descriptionRows(
        text,
        MIN_DESCRIPTION_ROWS,
        MAX_DESCRIPTION_ROWS,
        DESCRIPTION_ROW_PADDING,
    )

    let mode: DescriptionMode = 'view'

    if (isEditing) {
        mode = 'edit'
    } else if (isBlank) {
        mode = 'empty'
    }

    function startEditing() {
        setIsEditing(true)
    }

    function stopEditing() {
        setIsEditing(false)
    }

    return {
        mode,
        text,
        rows,
        startEditing,
        stopEditing,
    }
}
