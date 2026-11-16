import { Check, Copy } from 'lucide-react'

import { Button } from '@/components/ui/Button/Button'
import { useCopyButton } from '@/components/ui/CopyButton/hooks/useCopyButton'
import { COPIED_LABEL, ICON_SIZE } from '@/components/ui/CopyButton/logic/config'
import type { CopyButtonProps } from '@/components/ui/CopyButton/types'

export function CopyButton({
    text,
    label = 'Copy',
    copiedLabel = COPIED_LABEL,
    icon = <Copy size={ICON_SIZE} />,
    variant = 'ghost',
    className,
    title,
}: CopyButtonProps) {
    const { isCopied, copy } = useCopyButton(text)

    return (
        <Button
            variant={variant}
            className={className}
            title={title}
            icon={isCopied ? <Check size={ICON_SIZE} /> : icon}
            onClick={copy}
        >
            {isCopied ? copiedLabel : label}
        </Button>
    )
}
