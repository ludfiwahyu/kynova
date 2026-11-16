import { X } from 'lucide-react'

import { Button } from '@/components'
import { SMALL_ICON_SIZE } from '@/pages/database/logic/config'
import type { DatabasePickerPartProps } from '@/pages/database/types'

export function RecentDatabases({ picker }: DatabasePickerPartProps) {
    return (
        <div className="db-recent">
            <span className="db-label">Used before</span>

            {picker.recentRows.map((row) => (
                <span
                    key={row.id}
                    className="db-recent-row"
                >
                    <Button
                        variant="plain"
                        className="db-recent-use"
                        aria-current={row.inUse || undefined}
                        disabled={!picker.isIdle}
                        onClick={() => picker.useRecent(row.id)}
                    >
                        {row.label}
                        {row.inUse && <span className="db-in-use">In use</span>}
                    </Button>

                    <Button
                        variant="icon"
                        icon={<X size={SMALL_ICON_SIZE} />}
                        aria-label={row.forgetLabel}
                        title="Forget"
                        onClick={() => picker.forgetRecent(row.id)}
                    />
                </span>
            ))}
        </div>
    )
}
