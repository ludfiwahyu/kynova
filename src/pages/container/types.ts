import type { containerPage } from '@/pages/container/logic/config'
import type { TabId } from '@/utils'
import type { CollectionItem, FolderItem } from '#shared/types.ts'

export type Section = TabId<typeof containerPage>

export interface ContainerViewProps {
    item: CollectionItem | FolderItem
}

export interface DescriptionEditorProps {
    description: string | undefined
    onChange: (description: string) => void
    canEdit: boolean
    subject: string
}

export interface LiveTab {
    count?: number
    dot?: boolean
}

export type DescriptionMode = 'edit' | 'empty' | 'view'
