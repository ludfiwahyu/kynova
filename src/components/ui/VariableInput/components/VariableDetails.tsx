import { Input } from '@/components/ui/Input/Input'
import { ScopeBadge } from '@/components/ui/VariableInput/components/ScopeBadge'
import { useVariableDetails } from '@/components/ui/VariableInput/hooks/useVariableDetails'
import { EMPTY_TEXT } from '@/components/ui/VariableInput/logic/config'
import type { VariableDetailsProps } from '@/components/ui/VariableInput/types'

/**
 * A variable's value and where it comes from, under the variable the pointer rests on.
 * Environment and collection values can be changed here: Enter or leaving the field saves.
 */
export function VariableDetails({
    name,
    entry,
    environmentName,
    onSave,
    position,
    onPointerEnter,
    onPointerLeave,
}: VariableDetailsProps) {
    const details = useVariableDetails({
        name,
        entry,
        environmentName,
        onSave,
        onPointerLeave,
    })

    return (
        <div
            ref={details.ref}
            role="dialog"
            aria-label={`Variable ${name}`}
            className="menu w-80 p-3"
            style={position}
            onPointerEnter={onPointerEnter}
            onPointerLeave={details.handlePointerLeave}
            onBlur={details.handleBlur}
        >
            {entry ? (
                <>
                    {details.canSave ? (
                        <Input
                            variant="plain"
                            className="input w-full font-mono"
                            aria-label={`Value of ${name}`}
                            value={details.draft}
                            spellCheck={false}
                            onValueChange={details.setDraft}
                            onBlur={details.save}
                            onKeyDown={details.handleKeyDown}
                        />
                    ) : (
                        <p className="m-0 font-mono break-all text-ink">
                            {details.isEmptyValue ? (
                                <span className="text-ink-3">{EMPTY_TEXT}</span>
                            ) : (
                                details.valueText
                            )}
                        </p>
                    )}

                    <div className="mt-2 flex items-center gap-2 text-ink-2">
                        <ScopeBadge scope={entry.scope} />
                        <span className="truncate">{details.where}</span>
                    </div>
                </>
            ) : (
                <>
                    <p className="m-0 font-mono text-danger">{details.missingName}</p>
                    <p className="mt-2 mb-0 text-ink-2">
                        Not defined. Add it to the active environment or to the collection’s
                        variables.
                    </p>
                </>
            )}
        </div>
    )
}
