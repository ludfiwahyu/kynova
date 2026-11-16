import { openSettings, openWorkspaceTab, useWorkspaceId } from '@/stores'

export function useSettingsMenu() {
    const workspaceId = useWorkspaceId()

    function openApp() {
        openSettings('general')
    }

    function openWorkspace() {
        openWorkspaceTab(workspaceId, 'settings')
    }

    function openAccount() {
        openSettings('account')
    }

    return {
        openApp,
        openWorkspace,
        openAccount,
    }
}
