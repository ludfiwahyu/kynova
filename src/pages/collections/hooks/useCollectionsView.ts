import type { ChangeEvent } from 'react'
import { useMemo, useRef, useState } from 'react'

import { useRowGlide } from '@/pages/collections/hooks/useRowGlide'
import { visibleIds } from '@/pages/collections/logic/helpers'
import {
    createCollection,
    editNameSoon,
    expand,
    openTab,
    openWorkspaceTab,
    saveItems,
    useCanEdit,
    useUi,
    useWorkspace,
    useWorkspaceId,
    useWorkspaceSettings,
} from '@/stores'
import { childrenOf, importCollection, nextOrder } from '@/utils'

export function useCollectionsView() {
    const items = useWorkspace((state) => state.items)
    const expanded = useUi((state) => state.expanded)
    const settings = useWorkspaceSettings()
    const workspaceId = useWorkspaceId()
    const canEdit = useCanEdit()

    const fileInput = useRef<HTMLInputElement>(null)
    const treeRef = useRef<HTMLDivElement>(null)

    const [filter, setFilter] = useState('')
    const [importError, setImportError] = useState<string | null>(null)

    useRowGlide(treeRef, [items, expanded])

    const visible = useMemo(() => visibleIds(items, filter), [items, filter])
    const collections = childrenOf(items, null).filter(
        (collection) => !visible || visible.has(collection.id),
    )

    const hasNone = collections.length === 0
    const isEmpty = hasNone && !visible
    const hasNoMatch = hasNone && Boolean(visible)
    const noMatchText = `Nothing matches “${filter.trim()}”.`
    const showEnvironments = settings.panels?.environments !== false

    function newCollection() {
        const collection = createCollection()

        expand(collection.id)
        editNameSoon(collection.id)
        openTab({
            kind: 'item',
            id: collection.id,
        })
    }

    async function importFile(file: File | undefined) {
        if (!file) {
            return
        }

        try {
            const imported = importCollection(await file.text(), nextOrder(items, null))

            saveItems(imported)
            expand(imported[0].id)
            openTab({
                kind: 'item',
                id: imported[0].id,
            })
            setImportError(null)
        } catch (error) {
            setImportError((error as Error).message)
        }
    }

    function chooseFile() {
        fileInput.current?.click()
    }

    function handleFile(event: ChangeEvent<HTMLInputElement>) {
        void importFile(event.target.files?.[0])
        event.target.value = ''
    }

    function openOverview() {
        openWorkspaceTab(workspaceId, 'overview')
    }

    function openCustomize() {
        openWorkspaceTab(workspaceId, 'settings')
    }

    return {
        canEdit,
        fileInput,
        treeRef,
        filter,
        importError,
        visible,
        collections,
        isEmpty,
        hasNoMatch,
        noMatchText,
        showEnvironments,
        setFilter,
        newCollection,
        chooseFile,
        handleFile,
        openOverview,
        openCustomize,
    }
}
