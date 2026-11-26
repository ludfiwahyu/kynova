import { ResizeHandle } from '@/components'
import { BottomPanel } from '@/layouts/Workbench/components/BottomPanel'
import { RightPanel } from '@/layouts/Workbench/components/RightPanel'
import { Sidebar } from '@/layouts/Workbench/components/Sidebar'
import { StatusBar } from '@/layouts/Workbench/components/StatusBar'
import { TabContent } from '@/layouts/Workbench/components/TabContent'
import { TabStrip } from '@/layouts/Workbench/components/TabStrip'
import { TopBar } from '@/layouts/Workbench/components/TopBar'
import { useWorkbench } from '@/layouts/Workbench/hooks/useWorkbench'
import type { WorkbenchProps } from '@/layouts/Workbench/types'
import { SettingsDialog } from '@/pages/settings'

export function Workbench({ workspaceId }: WorkbenchProps) {
    const bench = useWorkbench(workspaceId)
    const { resize } = bench

    return (
        <div
            className="shell"
            style={bench.shellStyle}
            data-console-dock={bench.consoleDock}
            data-sidebar={bench.sidebarOpen ? 'open' : 'closed'}
            data-right-panel={bench.hasRightPanel ? 'open' : 'closed'}
        >
            <TopBar />

            {bench.showScrim && (
                <div
                    className="shell-scrim"
                    aria-hidden="true"
                    onClick={bench.closeFloating}
                />
            )}

            <Sidebar />

            {bench.sidebarOpen && (
                <ResizeHandle
                    orientation="vertical"
                    className="sidebar-resize"
                    label="Resize sidebar"
                    onDragStart={resize.startSidebar}
                    onDrag={resize.dragSidebar}
                    onReset={resize.resetSidebar}
                />
            )}

            <main
                ref={bench.mainRef}
                className="shell-main"
                data-layout-flip
            >
                <TabStrip />
                <TabContent />
            </main>

            {bench.hasRightPanel && (
                <ResizeHandle
                    orientation="vertical"
                    className="panel-resize"
                    label="Resize side panel"
                    onDragStart={resize.startRight}
                    onDrag={resize.dragRight}
                    onReset={resize.resetRight}
                />
            )}

            <RightPanel />

            {bench.consoleSide && (
                <ResizeHandle
                    key={bench.consoleSide}
                    orientation="vertical"
                    className={bench.consoleResizeClass}
                    label="Resize console panel"
                    onDragStart={resize.startConsole}
                    onDrag={resize.dragConsole}
                    onReset={resize.resetConsole}
                />
            )}

            {bench.hasBottomBelow && (
                <ResizeHandle
                    orientation="horizontal"
                    className="bottom-resize"
                    label="Resize console panel"
                    onDragStart={resize.startBottom}
                    onDrag={resize.dragBottom}
                    onReset={resize.resetBottom}
                />
            )}

            <BottomPanel
                dock={bench.consoleDock}
                workArea={bench.workArea}
            />

            <StatusBar />
            <SettingsDialog />
        </div>
    )
}
