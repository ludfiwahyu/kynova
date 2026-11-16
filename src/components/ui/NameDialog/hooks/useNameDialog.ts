import type { FormEvent } from 'react'
import { useState } from 'react'

import type { NameDialogProps } from '@/components/ui/NameDialog/types'

export function useNameDialog({ initialName = '', onSubmit, onClose }: NameDialogProps) {
    const [name, setName] = useState(initialName)
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const canSubmit = !isSubmitting && name.trim() !== ''

    async function submit(event: FormEvent) {
        event.preventDefault()
        setIsSubmitting(true)

        try {
            await onSubmit(name.trim())
            onClose()
        } catch (failure) {
            setError((failure as Error).message)
            setIsSubmitting(false)
        }
    }

    return {
        name,
        error,
        canSubmit,
        setName,
        submit,
    }
}
