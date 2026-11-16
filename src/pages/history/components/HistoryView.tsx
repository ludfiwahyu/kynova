import { Trash2 } from 'lucide-react'

import { Button, EmptyState, MethodLabel, SidebarToolbar } from '@/components'
import { useHistoryView } from '@/pages/history/hooks/useHistoryView'
import { ICON_SIZE } from '@/pages/history/logic/config'

export function HistoryView() {
    const history = useHistoryView()

    return (
        <div className="sidebar-body">
            <SidebarToolbar title="History">
                <Button
                    variant="icon"
                    title="Clear history"
                    aria-label="Clear history"
                    disabled={history.isEmpty}
                    icon={<Trash2 size={ICON_SIZE} />}
                    onClick={history.clear}
                />
            </SidebarToolbar>

            {history.isEmpty ? (
                <EmptyState title="Nothing sent yet">
                    Requests you send appear here. Only you see your history.
                </EmptyState>
            ) : (
                <div className="tree sidebar-scroll">
                    {history.days.map((day) => (
                        <section key={day.day}>
                            <h3 className="tree-heading">{day.day}</h3>

                            {day.rows.map((row) => (
                                <Button
                                    variant="plain"
                                    className="tree-row history-row"
                                    key={row.id}
                                    disabled={row.disabled}
                                    title={row.title}
                                    onClick={() => history.open(row.itemId)}
                                >
                                    <MethodLabel method={row.method} />
                                    <span className="code grow truncate">{row.url}</span>
                                    <span
                                        className="status-text"
                                        data-tone={row.tone}
                                    >
                                        {row.statusText}
                                    </span>
                                    <span className="muted">{row.time}</span>
                                </Button>
                            ))}
                        </section>
                    ))}
                </div>
            )}
        </div>
    )
}
