import { Info } from 'lucide-react'

import { INFO_ICON_SIZE } from '@/pages/request/logic/config'
import type { InfoMarkProps } from '@/pages/request/types'

export function InfoMark({ text }: InfoMarkProps) {
    return (
        <span
            className="auth-info"
            role="img"
            aria-label={text}
            title={text}
        >
            <Info size={INFO_ICON_SIZE} />
        </span>
    )
}
