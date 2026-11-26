import { useEffect, useState } from 'react'

import { toUpdateView } from '@/pages/settings/logic/updates'
import type { UpdateState } from '#shared/desktop.ts'

export function useUpdatesRow() {
    const updates = window.kynovaDesktop?.updates
    const [state, setState] = useState<UpdateState>({ status: 'unsupported' })

    useEffect(() => updates?.onState(setState), [updates])

    if (!updates || state.status === 'unsupported') {
        return null
    }

    const view = toUpdateView(state)

    return {
        ...view,
        run: () => updates.run(view.action),
    }
}
