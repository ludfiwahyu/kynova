import type { TagColor } from '#shared/types.ts'

export interface ColorTagButtonProps {
    color?: TagColor
    disabled?: boolean
    onChange: (color: TagColor | undefined) => void
}
