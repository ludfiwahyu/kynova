import { useEffect, useState } from 'react'

import { useShortcut } from '@/hooks'
import type { SaveControlsProps } from '@/pages/request/types'
import { discardDraft, saveDraft, useCanEdit, useDraft } from '@/stores'
import { formatWhen } from '@/utils'

export function useSaveControls({ item }: SaveControlsProps) {
    const canEdit = useCanEdit()
    const { isDirty } = useDraft(item.id)
    const [isSavingAs, setIsSavingAs] = useState(false)
    const [savedAt, setSavedAt] = useState(0)

    const savedLabel = item.savedBy
        ? `Saved by ${item.savedBy}, ${formatWhen(item.savedAt ?? 0)}`
        : 'Saved for everyone in this workspace'

    function save() {
        if (canEdit && isDirty) {
            saveDraft(item.id)
            setSavedAt(Date.now())
        }
    }

    useShortcut('request.save', save)

    useEffect(() => {
        if (!savedAt) {
            return
        }

        const timer = setTimeout(() => setSavedAt(0), 1200)

        return () => clearTimeout(timer)
    }, [savedAt])

    useShortcut('request.saveAs', () => {
        if (canEdit) {
            setIsSavingAs(true)
        }
    })

    return {
        canEdit,
        isDirty,
        justSaved: savedAt > 0,
        savedLabel,
        isSavingAs,
        save,
        discard: () => discardDraft(item.id),
        openSaveAs: () => setIsSavingAs(true),
        closeSaveAs: () => setIsSavingAs(false),
    }
}
