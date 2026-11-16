import { useIssues } from '@/layouts/Workbench/hooks/useIssues'
import { CONNECTION_LABEL, ROLE_LABEL } from '@/layouts/Workbench/logic/config'
import { dismissNotice, toggleBottomPanel, toggleSidebarOpen, useUi, useWorkspace } from '@/stores'

export function useStatusBar() {
    const connection = useWorkspace((state) => state.connection)
    const role = useWorkspace((state) => state.role)
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
        roleLabel: role ? ROLE_LABEL[role] : '',
        showRole: connection === 'connected',
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
