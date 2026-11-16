import type { ComponentProps, ReactNode } from 'react'

export interface RadioProps extends Omit<ComponentProps<'input'>, 'type'> {
    label: ReactNode
}
