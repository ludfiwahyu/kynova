import { EmptyState } from '@/components'
import { ConsoleRow } from '@/layouts/Workbench/components/ConsoleRow'
import { useConsoleView } from '@/layouts/Workbench/hooks/useConsoleView'
import type { ConsoleViewProps } from '@/layouts/Workbench/types'

export function ConsoleView(props: ConsoleViewProps) {
    const view = useConsoleView(props)

    return (
        <div className="contents">
            {view.isEmpty && (
                <EmptyState
                    title={view.emptyTitle}
                    className="bottom-empty"
                >
                    {view.emptyText}
                </EmptyState>
            )}

            {!view.isEmpty && (
                <div
                    ref={view.listRef}
                    className="bottom-scroll"
                    onScroll={view.handleScroll}
                >
                    <ol
                        className="console-list"
                        aria-label="Console log"
                    >
                        {view.rows.map((row) => (
                            <ConsoleRow
                                key={row.id}
                                row={row}
                                isOpen={view.isOpen(row.id)}
                                onToggle={() => view.toggle(row.id)}
                            />
                        ))}
                    </ol>
                </div>
            )}
        </div>
    )
}
