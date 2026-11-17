import { useIssues } from '@/layouts/Workbench/hooks/useIssues'
import { CONNECTION_LABEL } from '@/layouts/Workbench/logic/config'
import { dismissNotice, toggleBottomPanel, toggleSidebarOpen, useUi, useWorkspace } from '@/stores'

export function useStatusBar() {
    const connection = useWorkspace((state) => state.connection)
    const notice = useWorkspace((state) => state.notice)
    const sidebarOpen = useUi((state) => state.layout.sidebarOpen)
    const bottomPanel = useUi((state) => state.bottomPanel)
    const issueCount = useIssues().length

    const sidebarLabel = sidebarOpen ? 'Hide sidebar' : 'Show sidebar'

    function toggleConsole() {
        toggleBottomPanel('console')
    }

    function toggleIssues() {
        toggleBottomPanel('issues')
    }

    return {
        connection,
        connectionLabel: CONNECTION_LABEL[connection],
        notice,
        sidebarOpen,
        sidebarLabel,
        consoleOpen: bottomPanel === 'console',
        issuesOpen: bottomPanel === 'issues',
        issueCount,
        toggleSidebar: toggleSidebarOpen,
        toggleConsole,
        toggleIssues,
        dismissNotice,
    }
}
