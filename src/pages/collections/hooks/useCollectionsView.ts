import type { ChangeEvent, DragEvent } from 'react'
import { useMemo, useRef, useState } from 'react'

import { choose } from '@/components'
import { useRowGlide } from '@/pages/collections/hooks/useRowGlide'
import { sameCollection, visibleIds } from '@/pages/collections/logic/helpers'
import {
    clearFilterFolded,
    createCollection,
    deleteItem,
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
import { MAX_NAME_LENGTH } from '#shared/limits.ts'
import type { Item } from '#shared/types.ts'

export function useCollectionsView() {
    const items = useWorkspace((state) => state.items)
    const expanded = useUi((state) => state.expanded)
    const filterFolded = useUi((state) => state.filterFolded)
    const settings = useWorkspaceSettings()
    const workspaceId = useWorkspaceId()
    const canEdit = useCanEdit()

    const fileInput = useRef<HTMLInputElement>(null)
    const treeRef = useRef<HTMLDivElement>(null)

    const [filter, setFilter] = useState('')
    const [importError, setImportError] = useState<string | null>(null)
    const [isDropping, setDropping] = useState(false)

    useRowGlide(treeRef, [items, expanded, filterFolded])

    const visible = useMemo(() => visibleIds(items, filter), [items, filter])
    const collections = childrenOf(items, null).filter(
        (collection) => !visible || visible.has(collection.id),
    )

    const hasNone = collections.length === 0
    const isEmpty = hasNone && !visible
    const hasNoMatch = hasNone && Boolean(visible)
    const noMatchText = `Nothing matches “${filter.trim()}”.`
    const showEnvironments = settings.panels?.environments !== false

    // A new search starts with every match open.
    function changeFilter(value: string) {
        clearFilterFolded()
        setFilter(value)
    }

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
                    const [collection, ...rest] = imported.items
                    const current = useWorkspace.getState().items
                    const existing = sameCollection(current, collection)
                    const answer = existing ? await askAboutSame(existing.name) : null

                    if (answer === 'cancel') {
                        continue
                    }

                    let added: Item = collection

                    if (existing && answer === 'action') {
                        // The old one goes to the Archive, so a replace can be undone.
                        deleteItem(existing.id)
                        added = {
                            ...collection,
                            order: existing.order,
                            color: existing.kind === 'collection' ? existing.color : undefined,
                        } as Item
                    } else if (answer === 'alternative') {
                        added = {
                            ...collection,
                            name: `${collection.name} Copy`.slice(0, MAX_NAME_LENGTH),
                        }
                    }

                    saveItems([added, ...rest])
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

    function askAboutSame(name: string) {
        return choose({
            title: 'Collection already exists',
            message: `“${name}” is already in this workspace. Replace moves the current one to the Archive.`,
            action: 'Replace',
            alternative: 'Make a copy',
        })
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
        changeFilter,
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
