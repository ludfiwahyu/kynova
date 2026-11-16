import type { ReactNode } from 'react'

import type { ButtonVariant } from '@/components/ui/Button/types'

export interface CopyButtonProps {
    text: string
    label?: string
    copiedLabel?: string
    icon?: ReactNode
    variant?: ButtonVariant
    className?: string
    title?: string
}
