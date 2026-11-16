import { type FocusEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react'

import { FADE_IN } from '@/components/ui/VariableInput/logic/config'
import { scopeLabel } from '@/components/ui/VariableInput/logic/helpers'
import type { VariableDetailsProps } from '@/components/ui/VariableInput/types'
import { enter } from '@/utils'

export function useVariableDetails({
    name,
    entry,
    environmentName,
    onSave,
    onPointerLeave,
}: Pick<VariableDetailsProps, 'name' | 'entry' | 'environmentName' | 'onSave' | 'onPointerLeave'>) {
    const ref = useRef<HTMLDivElement>(null)
    const [draft, setDraft] = useState(entry?.value ?? '')
    const canSave = Boolean(onSave && entry && entry.scope !== 'dynamic' && entry.scope)

    useEffect(() => {
        if (ref.current) {
            enter(ref.current, FADE_IN)
        }
    }, [])

    // Another person, or another field, may change the value meanwhile.
    useEffect(() => setDraft(entry?.value ?? ''), [entry?.value])

    function save() {
        if (canSave && entry && draft !== entry.value) {
            onSave!(entry, draft)
        }
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            save()
        }

        if (event.key === 'Escape') {
            setDraft(entry?.value ?? '')
            onPointerLeave()
        }
    }

    // While its value is being edited, it stays.
    function handlePointerLeave() {
        if (!ref.current?.contains(document.activeElement)) {
            onPointerLeave()
        }
    }

    function handleBlur(event: FocusEvent) {
        if (!ref.current?.contains(event.relatedTarget as Node | null)) {
            onPointerLeave()
        }
    }

    return {
        ref,
        draft,
        setDraft,
        canSave,
        save,
        handleKeyDown,
        handlePointerLeave,
        handleBlur,
        where: entry ? scopeLabel(entry, environmentName) : '',
        missingName: `{{${name}}}`,
        valueText: entry?.value ?? '',
        isEmptyValue: !entry?.value,
    }
}
