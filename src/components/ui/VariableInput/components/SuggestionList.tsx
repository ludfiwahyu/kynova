import { createPortal } from 'react-dom'

import { ScopeBadge } from '@/components/ui/VariableInput/components/ScopeBadge'
import { LIST_CLASS, LIST_MAX_WIDTH } from '@/components/ui/VariableInput/logic/config'
import { floatingContainer, pointUnder } from '@/components/ui/VariableInput/logic/helpers'
import type { SuggestionListProps } from '@/components/ui/VariableInput/types'

export function SuggestionList({ input, listId, start, rows, onChoose }: SuggestionListProps) {
    return createPortal(
        <div
            id={listId}
            role="listbox"
            aria-label="Variables"
            className={LIST_CLASS}
            style={{
                ...pointUnder(input, start),
                maxWidth: LIST_MAX_WIDTH,
            }}
            // Clicking a suggestion must not take the focus from the field.
            onMouseDown={(event) => event.preventDefault()}
        >
            {rows.map((row) => (
                <div
                    key={row.key}
                    id={row.id}
                    role="option"
                    aria-selected={row.isActive}
                    className={row.className}
                    onClick={() => onChoose(row.entry)}
                >
                    <ScopeBadge scope={row.entry.scope} />
                    <span className="truncate font-mono text-ink">{row.entry.name}</span>
                    <span className="ml-auto max-w-[45%] truncate pl-3 text-ink-3">
                        {row.valueText}
                    </span>
                </div>
            ))}
        </div>,
        floatingContainer(input),
    )
}
