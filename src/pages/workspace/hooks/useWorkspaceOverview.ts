import { useState } from 'react'

import { toCountsLabel, toMemberLines } from '@/pages/workspace/logic/mappers'
import type { WorkspaceSectionProps } from '@/pages/workspace/types'
import { useWorkspace } from '@/stores'

export function useWorkspaceOverview({ workspace }: WorkspaceSectionProps) {
    const items = useWorkspace((state) => state.items)
    const environments = useWorkspace((state) => state.environments)
    const members = useWorkspace((state) => state.members)

    const [isManaging, setIsManaging] = useState(false)

    const countsLabel = toCountsLabel(Object.values(items), Object.keys(environments).length)
    const manageLabel = workspace.role === 'owner' ? 'Manage people' : 'See people'

    function openPeople() {
        setIsManaging(true)
    }

    function closePeople() {
        setIsManaging(false)
    }

    return {
        countsLabel,
        manageLabel,
        isManaging,
        lines: toMemberLines(members),
        openPeople,
        closePeople,
    }
}
