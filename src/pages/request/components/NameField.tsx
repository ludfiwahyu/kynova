import { Input } from '@/components'
import { useNameField } from '@/pages/request/hooks/useNameField'
import type { NameFieldProps } from '@/pages/request/types'
import { MAX_NAME_LENGTH } from '#shared/limits.ts'

export function NameField(props: NameFieldProps) {
    const field = useNameField(props)

    return (
        <Input
            variant="plain"
            className="item-name"
            ref={field.ref}
            aria-label="Name"
            maxLength={MAX_NAME_LENGTH}
            value={field.draft}
            disabled={!field.canEdit}
            size={field.size}
            onValueChange={field.setDraft}
            onBlur={field.commit}
            onKeyDown={field.handleKeyDown}
        />
    )
}
