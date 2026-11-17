import { HoverLabel } from '@/components'
import { useVariables } from '@/hooks'
import { itemLabel } from '@/pages/collections/logic/helpers'
import type { ItemHoverLabelProps } from '@/pages/collections/types'
import { useDraft } from '@/stores'

/**
 * Wraps a tree row or a tab with a label that shows the item's name and, for a
 * request, its method and address as they are being edited here: variables show their
 * values, and one with no value shows as written in the error colour.
 */
export function ItemHoverLabel({ item, hint, children }: ItemHoverLabelProps) {
    const shown = useDraft(item.id).item ?? item
    const variables = useVariables(item)
    const label = itemLabel(shown, variables)

    return (
        <HoverLabel
            title={label.title}
            detail={label.detail?.map((part, index) => (
                <span
                    key={index}
                    className={part.isMissing ? 'text-danger' : undefined}
                >
                    {part.text}
                </span>
            ))}
            hint={hint ?? label.hint}
            lead={
                label.method && (
                    <span className={`method-text shrink-0 method-${label.method}`}>
                        {label.method}
                    </span>
                )
            }
        >
            {children}
        </HoverLabel>
    )
}
