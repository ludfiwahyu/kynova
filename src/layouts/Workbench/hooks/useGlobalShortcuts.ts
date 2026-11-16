import { useShortcut } from '@/hooks'
import { closeRightPanel, openSettings, toggleRightPanel, toggleSidebarOpen, useUi } from '@/stores'

/** App-wide shortcuts: Settings, and the left and right sidebars. */
export function useGlobalShortcuts(): void {
    // Tabs without a Save button still keep the browser's Save Page dialog away.
    useShortcut('request.save', () => {})
    useShortcut('interface.settings', () => openSettings())
    useShortcut('interface.toggleSidebar', toggleSidebarOpen)
    useShortcut('interface.toggleRightPanel', () => {
        if (useUi.getState().rightPanel) {
            closeRightPanel()

            return
        }

        toggleRightPanel('docs')
    })
}
