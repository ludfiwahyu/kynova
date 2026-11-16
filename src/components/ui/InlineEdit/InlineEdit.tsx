import { useInlineEdit } from '@/components/ui/InlineEdit/hooks/useInlineEdit'
import type { InlineEditProps } from '@/components/ui/InlineEdit/types'
import { MAX_NAME_LENGTH } from '#shared/limits.ts'

export function InlineEdit({ value, onSave, onCancel, label }: InlineEditProps) {
    const edit = useInlineEdit({
        value,
        onSave,
        onCancel,
    })

    return (
        <input
            className="input"
            aria-label={label}
            autoFocus
            maxLength={MAX_NAME_LENGTH}
            value={edit.draft}
            onFocus={edit.handleFocus}
            onChange={edit.handleChange}
            onBlur={edit.handleBlur}
            onKeyDown={edit.handleKeyDown}
            onClick={edit.handleClick}
        />
    )
}
