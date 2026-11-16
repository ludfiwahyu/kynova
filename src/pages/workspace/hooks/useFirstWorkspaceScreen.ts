import type { FormEvent } from 'react'
import { useState } from 'react'

import { createWorkspace, signOut } from '@/stores'

export function useFirstWorkspaceScreen() {
    const [name, setName] = useState('')
    const [error, setError] = useState<string | null>(null)

    async function submit(event: FormEvent) {
        event.preventDefault()

        try {
            await createWorkspace(name.trim())
        } catch (failure) {
            setError((failure as Error).message)
        }
    }

    function leave() {
        void signOut()
    }

    return {
        name,
        error,
        setName,
        submit,
        leave,
    }
}
