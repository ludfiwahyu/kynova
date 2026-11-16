import type { CSSProperties } from 'react'

import { readableInkOn } from '@/settings'

export function accentStyle(accent?: string): CSSProperties | undefined {
    if (!accent) {
        return undefined
    }

    return {
        '--accent': accent,
        '--accent-ink': readableInkOn(accent),
    } as CSSProperties
}
