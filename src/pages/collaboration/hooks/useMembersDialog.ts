import { useState } from 'react'

import { memberCountLabel } from '@/pages/collaboration/logic/helpers'
import { toMemberViews } from '@/pages/collaboration/logic/mappers'
import { api } from '@/services'
import { useActiveWorkspace, useSession, useWorkspace } from '@/stores'
import type { AssignableRole, Member } from '#shared/types.ts'

export function useMembersDialog() {
    const workspace = useActiveWorkspace()
    const selfId = useSession((state) => state.user?.id)
    const members = useWorkspace((state) => state.members)
    const isOwner = useWorkspace((state) => state.role === 'owner')

    const [error, setError] = useState<string | null>(null)

    const memberViews = toMemberViews(members, {
        selfId,
        isOwner,
    })

    const title = `Share ${workspace?.name ?? ''}`
    const countLabel = memberCountLabel(members.length)

    function change(action: Promise<void>) {
        action.then(
            () => setError(null),
            (failure: Error) => setError(failure.message),
        )
    }

    function setRole(member: Member, role: AssignableRole) {
        if (workspace) {
            change(api.setMemberRole(workspace.id, member.userId, role))
        }
    }

    function removeMember(member: Member) {
        if (workspace) {
            change(api.removeMember(workspace.id, member.userId))
        }
    }

    return {
        workspace,
        isOwner,
        error,
        title,
        countLabel,
        memberViews,
        setRole,
        removeMember,
    }
}
