import type { ReactNode } from 'react'

import type { SidebarSection as SectionId } from '@/stores'

export interface SidebarSectionProps {
    id: SectionId
    title: string
    grow?: boolean
    actions?: ReactNode
    children: ReactNode
}
