import { CircleAlert, TriangleAlert, X } from 'lucide-react'

import { Button, DockGrip, Select, Tabs } from '@/components'
import { ConsoleView } from '@/layouts/Workbench/components/ConsoleView'
import { IssuesView } from '@/layouts/Workbench/components/IssuesView'
import { useBottomPanel } from '@/layouts/Workbench/hooks/useBottomPanel'
import {
    CLOSE_ICON_SIZE,
    CONSOLE_FILTERS,
    CONSOLE_PLACES,
    COUNT_ICON_SIZE,
} from '@/layouts/Workbench/logic/config'
import type { BottomPanelProps } from '@/layouts/Workbench/types'

export function BottomPanel({ dock, workArea }: BottomPanelProps) {
    const bottom = useBottomPanel()

    if (!bottom.panel) {
        return null
    }

    return (
        <section
            ref={bottom.panelRef}
            className="bottom-panel"
            data-layout-flip
            data-dock={dock}
            aria-label="Console and issues"
        >
            <header className="bottom-header">
                <Tabs
                    label="Bottom panel"
                    tabs={bottom.tabs}
                    active={bottom.panel}
                    onChange={bottom.select}
                />

                <span className="grow" />

                {bottom.isConsole && (
                    <>
                        <Select
                            variant="quiet"
                            label="Show logs"
                            value={bottom.filter}
                            options={[...CONSOLE_FILTERS]}
                            onChange={bottom.setFilter}
                        />

                        <Button
                            variant="ghost"
                            disabled={!bottom.canClear}
                            onClick={bottom.clear}
                        >
                            Clear
                        </Button>
                    </>
                )}

                {!bottom.isConsole && (
                    <span className="issue-counts">
                        <span data-severity="error">
                            <CircleAlert size={COUNT_ICON_SIZE} /> {bottom.counts.errors}
                        </span>

                        <span data-severity="warning">
                            <TriangleAlert size={COUNT_ICON_SIZE} /> {bottom.counts.warnings}
                        </span>
                    </span>
                )}

                <DockGrip
                    name="Console and Issues"
                    dock={dock}
                    onDock={bottom.changeDock}
                    area={workArea}
                    labels={CONSOLE_PLACES}
                />

                <Button
                    variant="icon"
                    icon={<X size={CLOSE_ICON_SIZE} />}
                    aria-label="Close panel"
                    title="Close panel"
                    onClick={bottom.close}
                />
            </header>

            {bottom.isConsole && <ConsoleView filter={bottom.filter} />}
            {!bottom.isConsole && <IssuesView issues={bottom.issues} />}
        </section>
    )
}
