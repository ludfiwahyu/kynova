import type { AvatarProps } from '@/components/ui/Avatar/types'
import { initials } from '@/utils'

export function Avatar({ name, color }: AvatarProps) {
    return (
        <span
            className="avatar"
            style={{ background: color }}
            title={name}
            aria-label={name}
        >
            {initials(name)}
        </span>
    )
}
