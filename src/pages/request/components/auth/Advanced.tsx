import { ChevronRight } from 'lucide-react'

import { ADVANCED_ICON_SIZE } from '@/pages/request/logic/config'
import type { AdvancedProps } from '@/pages/request/types'

export function Advanced({ title = 'Advanced configuration', note, children }: AdvancedProps) {
    return (
        <details className="auth-advanced">
            <summary>
                <ChevronRight
                    size={ADVANCED_ICON_SIZE}
                    className="auth-advanced-chevron"
                />
                {title}
            </summary>

            {note && <p className="auth-note">{note}</p>}

            <div className="auth-rows">{children}</div>
        </details>
    )
}
