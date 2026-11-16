import { ChevronRight } from 'lucide-react'

import { Button } from '@/components'
import { ConsoleDetail } from '@/layouts/Workbench/components/ConsoleDetail'
import { CHEVRON_SIZE } from '@/layouts/Workbench/logic/config'
import type { ConsoleRowProps } from '@/layouts/Workbench/types'

export function ConsoleRow({ row, isOpen, onToggle }: ConsoleRowProps) {
    return (
        <li
            className="console-entry"
            data-problem={row.isProblem || undefined}
        >
            <Button
                variant="plain"
                className="console-row"
                aria-expanded={isOpen}
                onClick={onToggle}
            >
                <ChevronRight
                    size={CHEVRON_SIZE}
                    className="console-chevron"
                />

                <span className="console-time">{row.time}</span>

                <span
                    className="console-method"
                    data-method={row.method}
                >
                    {row.method}
                </span>

                <span
                    className="console-url truncate"
                    title={row.url}
                >
                    {row.url}
                </span>

                <span className="console-source truncate">{row.source}</span>

                <span
                    className="console-status"
                    data-tone={row.tone}
                >
                    {row.hasResponse ? row.status : row.errorText}
                </span>

                {row.hasResponse && <span className="console-duration">{row.duration}</span>}
            </Button>

            {isOpen && <ConsoleDetail row={row} />}
        </li>
    )
}
