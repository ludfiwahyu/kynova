import { useRef, useState } from 'react'

import { useEnterAnimation } from '@/hooks'
import { useIssues } from '@/layouts/Workbench/hooks/useIssues'
import { PANEL_RISE } from '@/layouts/Workbench/logic/config'
import { toIssueCounts } from '@/layouts/Workbench/logic/mappers'
import type { ConsoleFilter } from '@/layouts/Workbench/types'
import type { Dock } from '@/stores'
import { clearConsole, setBottomPanel, setLayout, useConsole, useUi } from '@/stores'

export function useBottomPanel() {
    const panel = useUi((state) => state.bottomPanel)
    const entries = useConsole((state) => state.entries)
    const issues = useIssues()

    const [filter, setFilter] = useState<ConsoleFilter>('all')

    // Rises into place when it opens.
    const panelRef = useRef<HTMLElement>(null)

    useEnterAnimation(panelRef, Boolean(panel), PANEL_RISE)

    const tabs = [
        {
            id: 'console' as const,
            label: 'Console',
        },
        {
            id: 'issues' as const,
            label: 'Issues',
            count: issues.length,
        },
    ]

    function changeDock(consoleDock: Dock) {
        setLayout({ consoleDock })
    }

    function close() {
        setBottomPanel(null)
    }

    return {
        panel,
        panelRef,
        issues,
        filter,
        tabs,
        counts: toIssueCounts(issues),
        isConsole: panel === 'console',
        canClear: entries.length > 0,
        setFilter,
        select: setBottomPanel,
        clear: clearConsole,
        changeDock,
        close,
    }
}
