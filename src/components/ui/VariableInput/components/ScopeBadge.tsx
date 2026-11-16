import { BADGE_BASE } from '@/components/ui/VariableInput/logic/config'
import { badgeOf } from '@/components/ui/VariableInput/logic/helpers'
import { classNames } from '@/components/utils/helpers'
import type { VariableEntry } from '@/utils'

/** A small letter for where a variable comes from: E environment, C collection, $ dynamic. */
export function ScopeBadge({ scope }: { scope?: VariableEntry['scope'] }) {
    const badge = badgeOf(scope)

    return (
        <span
            className={classNames(BADGE_BASE, badge.className)}
            aria-hidden="true"
        >
            {badge.letter}
        </span>
    )
}
