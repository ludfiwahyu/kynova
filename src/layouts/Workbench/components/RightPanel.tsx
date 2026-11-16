import { X } from 'lucide-react'

import { Button } from '@/components'
import { RightPanelContent } from '@/layouts/Workbench/components/RightPanelContent'
import { useRightPanel } from '@/layouts/Workbench/hooks/useRightPanel'
import { CLOSE_PANEL_ICON_SIZE } from '@/layouts/Workbench/logic/config'

export function RightPanel() {
    const right = useRightPanel()

    return (
        <div className="contents">
            {right.panel && (
                <aside
                    ref={right.panelRef}
                    className="right-panel"
                    aria-label={right.title}
                >
                    <div className="right-panel-header">
                        <h2>{right.title}</h2>

                        <Button
                            variant="icon"
                            icon={<X size={CLOSE_PANEL_ICON_SIZE} />}
                            aria-label={right.closeLabel}
                            onClick={right.close}
                        />
                    </div>

                    <RightPanelContent
                        panel={right.panel}
                        item={right.item}
                    />
                </aside>
            )}

            <nav
                className="right-rail"
                aria-label="Side panels"
            >
                {right.rail.map((entry) => (
                    <Button
                        key={entry.id}
                        variant="plain"
                        className="right-rail-button"
                        aria-pressed={entry.isPressed}
                        aria-label={entry.label}
                        title={entry.label}
                        icon={entry.icon}
                        onClick={() => right.toggle(entry.id)}
                    >
                        {entry.count > 0 && <span className="rail-count">{entry.count}</span>}
                    </Button>
                ))}
            </nav>
        </div>
    )
}
