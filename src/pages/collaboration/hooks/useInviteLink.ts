import { useState } from 'react'

import { api } from '@/services'
import { inviteUrl } from '@/utils'
import type { AssignableRole } from '#shared/types.ts'

export function useInviteLink(workspaceId: string) {
    const [role, setRole] = useState<AssignableRole>('editor')
    const [link, setLink] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    async function createLink() {
        try {
            const { token } = await api.createInvite(workspaceId, role)

            setLink(inviteUrl(token))
            setError(null)
        } catch (failure) {
            setError((failure as Error).message)
        }
    }

    function create() {
        void createLink()
    }

    function changeRole(next: AssignableRole) {
        setRole(next)
        setLink(null)
    }

    return {
        role,
        link,
        error,
        create,
        changeRole,
    }
}
