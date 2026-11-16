import { useRef, useState } from 'react'

import { useEnterAnimation, useVariableContext, useVariables } from '@/hooks'
import { countContents, plural } from '@/pages/container/logic/helpers'
import { toContainerTabs } from '@/pages/container/logic/mappers'
import type { Section } from '@/pages/container/types'
import { keepTab, saveItem, useCanEdit, useWorkspace } from '@/stores'
import { downloadText, exportCollection } from '@/utils'
import type { CollectionItem, FolderItem, Item, KeyValue, Scripts } from '#shared/types.ts'

export function useContainerView(item: CollectionItem | FolderItem) {
    const items = useWorkspace((state) => state.items)
    const canEdit = useCanEdit()
    const variables = useVariables(item)
    const variableContext = useVariableContext(item)

    const [section, setSection] = useState<Section>('overview')
    const bodyRef = useRef<HTMLDivElement>(null)

    useEnterAnimation(bodyRef, section)

    const isCollection = item.kind === 'collection'
    const counts = countContents(items, item.id)
    const countsLabel = `${plural(counts.folders, 'folder')} · ${plural(counts.requests, 'request')}`
    const tabsLabel = isCollection ? 'Collection' : 'Folder'
    const tabs = toContainerTabs(item)
    const collectionVariables = item.kind === 'collection' ? (item.variables ?? []) : []

    function save(changes: Partial<Item>) {
        saveItem({
            ...item,
            ...changes,
        } as Item)
    }

    function changeDescription(description: string) {
        save({ description })
    }

    function changeVariables(rows: KeyValue[]) {
        save({ variables: rows } as Partial<CollectionItem>)
    }

    function changeScripts(scripts: Scripts) {
        save({ scripts })
    }

    function exportFile() {
        downloadText(`${item.name}.collection.json`, exportCollection(items, item.id))
    }

    function keepOpen() {
        keepTab({
            kind: 'item',
            id: item.id,
        })
    }

    return {
        canEdit,
        variables,
        variableContext,
        section,
        bodyRef,
        isCollection,
        countsLabel,
        tabsLabel,
        tabs,
        collectionVariables,
        setSection,
        changeDescription,
        changeVariables,
        changeScripts,
        exportFile,
        keepOpen,
    }
}
