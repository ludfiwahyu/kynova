import { useMemo } from 'react'

import { useActiveEnvironment } from '@/hooks'
import { useWorkspace } from '@/stores'
import type { Issue } from '@/utils'
import { findIssues } from '@/utils'

/** The workspace's issues, worked out again whenever its items or environments change. */
export function useIssues(): Issue[] {
    const items = useWorkspace((state) => state.items)
    const environments = useWorkspace((state) => state.environments)
    const active = useActiveEnvironment()

    return useMemo(() => findIssues(items, environments, active), [items, environments, active])
}
