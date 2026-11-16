import type { ChangeEvent, DragEvent } from 'react'
import { useMemo, useRef, useState } from 'react'

import { useRowGlide } from '@/pages/collections/hooks/useRowGlide'
import { visibleIds } from '@/pages/collections/logic/helpers'
import {
    createCollection,
    editNameSoon,
    expand,
    openTab,
    openWorkspaceTab,
    saveEnvironment,
    saveItems,
    useCanEdit,
    useUi,
    useWorkspace,
    useWorkspaceId,
    useWorkspaceSettings,
} from '@/stores'
import { childrenOf, importFile, nextOrder } from '@/utils'

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
    const [isDropping, setDropping] = useState(false)

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

    /** Imports each file as a collection or an environment, whichever it is. */
    async function importFiles(files: File[]) {
        if (files.length === 0) {
            return
        }

        const errors: string[] = []
        let order = nextOrder(items, null)
        let opened = false

        for (const file of files) {
            try {
                const imported = importFile(await file.text(), order)

                if (imported.kind === 'collection') {
                    const [collection] = imported.items

                    saveItems(imported.items)
                    expand(collection.id)
                    order += 1

                    if (!opened) {
                        openTab({
                            kind: 'item',
                            id: collection.id,
                        })
                    }
                } else {
                    saveEnvironment(imported.environment)

                    if (!opened) {
                        openTab({
                            kind: 'environment',
                            id: imported.environment.id,
                        })
                    }
                }

                opened = true
            } catch (error) {
                errors.push(`${file.name}: ${(error as Error).message}`)
            }
        }

        setImportError(errors.length > 0 ? errors.join('\n') : null)
    }

    function chooseFile() {
        fileInput.current?.click()
    }

    function handleFile(event: ChangeEvent<HTMLInputElement>) {
        void importFiles(Array.from(event.target.files ?? []))
        event.target.value = ''
    }

    const carriesFiles = (event: DragEvent<HTMLElement>) =>
        canEdit && event.dataTransfer.types.includes('Files')

    function dragOver(event: DragEvent<HTMLElement>) {
        if (!carriesFiles(event)) {
            return
        }

        event.preventDefault()
        event.dataTransfer.dropEffect = 'copy'
        setDropping(true)
    }

    function dragLeave(event: DragEvent<HTMLElement>) {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setDropping(false)
        }
    }

    function drop(event: DragEvent<HTMLElement>) {
        setDropping(false)

        if (!carriesFiles(event)) {
            return
        }

        event.preventDefault()
        void importFiles(Array.from(event.dataTransfer.files))
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
        isDropping,
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
        dragOver,
        dragLeave,
        drop,
        openOverview,
        openCustomize,
    }
}
