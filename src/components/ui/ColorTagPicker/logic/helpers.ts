import type { CSSProperties } from 'react'

import { HEX_COLOR, type TagColor } from '#shared/types.ts'

/** The attributes that paint a tag: a named colour by `data-tag`, a hex one by `--tag`. */
export function tagAttributes(color: TagColor | undefined): {
    'data-tag'?: string
    style?: CSSProperties
} {
    if (!color) {
        return {}
    }

    if (HEX_COLOR.test(color)) {
        return {
            'data-tag': 'custom',
            style: { '--tag': color } as CSSProperties,
        }
    }

    return { 'data-tag': color }
}

export const isHexColor = (value: string) => HEX_COLOR.test(value)
