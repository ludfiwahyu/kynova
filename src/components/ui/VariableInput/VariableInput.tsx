import { createPortal } from 'react-dom'

import { SuggestionList } from '@/components/ui/VariableInput/components/SuggestionList'
import { VariableDetails } from '@/components/ui/VariableInput/components/VariableDetails'
import { useVariableInput } from '@/components/ui/VariableInput/hooks/useVariableInput'
import { MIRROR_END } from '@/components/ui/VariableInput/logic/config'
import {
    floatingContainer,
    pointUnder,
    revealHint,
} from '@/components/ui/VariableInput/logic/helpers'
import type { VariableInputProps } from '@/components/ui/VariableInput/types'
import { classNames } from '@/components/utils/helpers'

/**
 * A text input for text with `{{variables}}`:
 *
 * - Known variables show in the accent colour, unknown ones in red. The colours come
 *   from a copy of the text drawn behind the transparent input, scrolled in step with it.
 * - Typing `{{` lists the variables there are (the active environment's, the collection's
 *   and the dynamic ones); ↑ ↓ choose, Enter or Tab put it in, Esc closes the list.
 * - Resting the pointer on a variable shows its value and where it comes from, and lets
 *   an editor change it there. ⌘ or Ctrl and a click opens it in the Variables panel.
 */
export function VariableInput({
    value,
    onChange,
    variables,
    className,
    onKeyDown,
    onBlur,
    ...props
}: VariableInputProps) {
    const field = useVariableInput({
        value,
        onChange,
        variables,
        onKeyDown,
        onBlur,
    })
    const { input, suggesting, hovered, context } = field

    return (
        <div
            className={classNames('variable-input', className)}
            onPointerMove={(event) => field.handlePointerMove(event.clientX)}
            onPointerLeave={field.hideSoon}
        >
            <div
                ref={field.mirrorRef}
                className="variable-input-mirror"
                aria-hidden="true"
            >
                {field.parts.map((part, index) =>
                    part.kind ? (
                        <span
                            key={index}
                            data-token={part.kind}
                        >
                            {part.text}
                        </span>
                    ) : (
                        part.text
                    ),
                )}
                {MIRROR_END}
            </div>

            <input
                ref={field.inputRef}
                {...props}
                className="variable-input-field"
                value={value}
                spellCheck={false}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={field.isListOpen}
                aria-controls={field.isListOpen ? field.listId : undefined}
                aria-activedescendant={field.activeId}
                onChange={(event) =>
                    field.handleChange(event.target.value, event.target.selectionStart)
                }
                onKeyDown={field.handleKeyDown}
                onClick={field.handleClick}
                onBlur={field.handleBlur}
                onScroll={field.syncScroll}
                onSelect={(event) => field.handleSelect(event.currentTarget)}
                onKeyUp={field.syncScroll}
            />

            {field.isListOpen && suggesting && input && (
                <SuggestionList
                    input={input}
                    listId={field.listId}
                    start={suggesting.start}
                    rows={field.suggestions}
                    onChoose={field.choose}
                />
            )}

            {hovered &&
                !field.isListOpen &&
                input &&
                createPortal(
                    <VariableDetails
                        name={hovered.name}
                        entry={field.hoveredEntry}
                        environmentName={context?.environmentName}
                        onSave={context?.setValue}
                        revealHint={context?.reveal ? revealHint() : undefined}
                        position={pointUnder(input, hovered.start)}
                        onPointerEnter={field.keepHover}
                        onPointerLeave={field.closeHover}
                    />,
                    floatingContainer(input),
                )}
        </div>
    )
}
