import { useEffect, useState } from 'react'

import { ROLE_ARTICLE, ROLE_SUMMARY } from '@/pages/collaboration/logic/config'
import type { InviteScreenProps } from '@/pages/collaboration/types'
import { api } from '@/services'
import { acceptInvite } from '@/stores'
import { clearInviteFromLocation } from '@/utils'
import type { InvitePreview } from '#shared/types.ts'

export function useInviteScreen({ token, onDone }: InviteScreenProps) {
    const [invite, setInvite] = useState<InvitePreview | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isJoining, setIsJoining] = useState(false)

    const showInvite = invite !== null && !error
    const roleArticle = invite ? ROLE_ARTICLE[invite.role] : ''
    const roleSummary = invite ? ROLE_SUMMARY[invite.role] : ''
    const joinLabel = isJoining ? 'Joining…' : 'Join workspace'

    useEffect(() => {
        api.previewInvite(token).then(setInvite, (failure: Error) => setError(failure.message))
    }, [token])

    function finish() {
        clearInviteFromLocation()
        onDone()
    }

    async function join() {
        setIsJoining(true)

        try {
            await acceptInvite(token)
            finish()
        } catch (failure) {
            setError((failure as Error).message)
            setIsJoining(false)
        }
    }

    return {
        invite,
        error,
        isJoining,
        showInvite,
        roleArticle,
        roleSummary,
        joinLabel,
        finish,
        join,
    }
}
