import type { TagColor } from '#shared/types.ts'

export interface ColorTagPickerProps {
    value?: TagColor
    onChange: (color: TagColor | undefined) => void
}
