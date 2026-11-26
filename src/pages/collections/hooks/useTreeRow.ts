import type { KeyboardEvent, MouseEvent } from 'react'
import { useEffect, useRef, useState } from 'react'

import { useEnterAnimation } from '@/hooks'
import { useRowDrag } from '@/pages/collections/hooks/useRowDrag'
import {
    EMPTY_NOTE_BASE_PADDING,
    GROUP_ENTER,
    INDENT,
    IS_MAC,
    isContainer as isContainerItem,
} from '@/pages/collections/logic/config'
import {
    confirmDelete,
    depthStyle,
    focusSiblingRow,
    hasActions,
} from '@/pages/collections/logic/helpers'
import { confirmDeleteChosen } from '@/pages/collections/logic/selection'
import { treeOrder } from '@/pages/collections/logic/tree'
import type { TreeRowProps } from '@/pages/collections/types'
import {
    clearTreeSelection,
    createHttpRequest,
    editNameSoon,
    expand,
    keepTab,
    nameEdited,
    openTab,
    renameItem,
    saveItem,
    selectTreeRange,
    toggleExpanded,
    toggleFilterFolded,
    toggleTreeSelection,
    useCanEdit,
    useTreeDrag,
    useTreeSelection,
    useUi,
    useWorkspace,
} from '@/stores'
import { childrenOf } from '@/utils'
import type { TagColor } from '#shared/types.ts'

export function useTreeRow({ item, depth, visible }: TreeRowProps) {
    const items = useWorkspace((state) => state.items)
    const canEdit = useCanEdit()
    const isExpanded = useUi((state) => state.expanded[item.id] ?? false)
    const isFilterFolded = useUi((state) => state.filterFolded[item.id] ?? false)
    // While filtering, matches start open and folding is remembered apart from the tree's own.
    const isCollapsed = visible ? isFilterFolded : !isExpanded
    const isActive = useUi(
        (state) => state.activeTab?.kind === 'item' && state.activeTab.id === item.id,
    )
    const isChosen = useTreeSelection((state) => state.ids.includes(item.id))
    const hasChoice = useTreeSelection((state) => state.ids.length > 0)
    const dropZone = useTreeDrag((state) => (state.over?.id === item.id ? state.over.zone : null))
    const isDragged = useTreeDrag((state) => state.ids.includes(item.id))
    const isLanded = useTreeDrag((state) => state.landed.includes(item.id))

    // A new folder has no tab, so its name opens for typing right here in the tree.
    const isNewFolder = useUi((state) => state.editNameOf === item.id) && item.kind === 'folder'

    const groupRef = useRef<HTMLDivElement>(null)
    const [isRenaming, setIsRenaming] = useState(false)

    const container = isContainerItem(item)
    const children = container
        ? childrenOf(items, item.id).filter((child) => !visible || visible.has(child.id))
        : []

    const tab = {
        kind: 'item',
        id: item.id,
    } as const

    const drag = useRowDrag({
        item,
        isChosen,
        isCollapsed,
        isContainer: container,
        canEdit,
    })

    useEffect(() => {
        if (!isNewFolder) {
            return
        }

        setIsRenaming(true)
        nameEdited()
    }, [isNewFolder])

    useEnterAnimation(groupRef, container && !isCollapsed, GROUP_ENTER)

    function toggle() {
        if (visible) {
            toggleFilterFolded(item.id)
        } else {
            toggleExpanded(item.id)
        }
    }

    // View model

    const showGroup = container && !isCollapsed
    const showEmptyNote = children.length === 0 && !visible
    const showActions = hasActions(item, canEdit) && !isRenaming
    const showAddRequest = item.kind === 'collection' && canEdit

    const styles = {
        row: depthStyle(depth),
        group: depthStyle(depth),
        empty: { paddingLeft: EMPTY_NOTE_BASE_PADDING + (depth + 1) * INDENT },
    }

    // Actions

    function startRenaming() {
        setIsRenaming(true)
    }

    function stopRenaming() {
        setIsRenaming(false)
    }

    function saveName(name: string) {
        renameItem(item, name)
        setIsRenaming(false)
    }

    function usesSelectionMenu(): boolean {
        const { ids } = useTreeSelection.getState()

        return ids.length > 1 && ids.includes(item.id)
    }

    function prepareContextMenu() {
        if (!isChosen) {
            clearTreeSelection(item.id)
        }
    }

    function addRequest() {
        const created = createHttpRequest(item.id)

        expand(item.id)
        editNameSoon(created.id)
        openTab({
            kind: 'item',
            id: created.id,
        })
    }

    function keep() {
        keepTab(tab)
    }

    // Middle click: a tab of its own, behind the current one.
    function openBehind(event: MouseEvent) {
        if (event.button === 1) {
            event.preventDefault()
            openTab(tab, { background: true })
        }
    }

    function stopClick(event: MouseEvent) {
        event.stopPropagation()
    }

    function foldOnly(event: MouseEvent) {
        event.stopPropagation()

        if (container) {
            toggle()
        }
    }

    function handleClick(event: MouseEvent<HTMLDivElement>) {
        const row = event.currentTarget

        // ⌘ or Ctrl: choose this row too (or not any more). Nothing opens.
        if (IS_MAC ? event.metaKey : event.ctrlKey) {
            toggleTreeSelection(item.id, treeOrder(row).openId)

            return
        }

        // Shift: choose every row from the last one clicked.
        if (event.shiftKey) {
            const { order, openId } = treeOrder(row)

            selectTreeRange(item.id, order, openId)

            return
        }

        clearTreeSelection(item.id)

        if (container) {
            toggle()
        }

        openTab(tab, { preview: true })
    }

    function widenChoice(row: HTMLElement, step: 1 | -1) {
        const next = focusSiblingRow(row, step)

        if (!next) {
            return
        }

        const { order, openId } = treeOrder(row)

        if (!useTreeSelection.getState().anchor) {
            clearTreeSelection(item.id)
        }

        selectTreeRange(next.dataset.itemId!, order, openId)
    }

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        if (event.target !== event.currentTarget) {
            return
        }

        const row = event.currentTarget

        // Shift+↑/↓ widens the choice row by row.
        if (event.shiftKey && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault()
            widenChoice(row, event.key === 'ArrowDown' ? 1 : -1)

            return
        }

        if (event.key === 'Escape' && hasChoice) {
            event.preventDefault()
            clearTreeSelection()

            return
        }

        if (event.key === 'Delete' && isChosen && useTreeSelection.getState().ids.length > 1) {
            event.preventDefault()

            if (canEdit) {
                void confirmDeleteChosen()
            }

            return
        }

        const actions: Record<string, () => void> = {
            Enter: () => openTab(tab),
            ' ': () => (container ? toggle() : openTab(tab, { preview: true })),
            ArrowDown: () => focusSiblingRow(row, 1),
            ArrowUp: () => focusSiblingRow(row, -1),
            ArrowRight: () =>
                container && isCollapsed ? expand(item.id) : focusSiblingRow(row, 1),
            ArrowLeft: () => (container && !isCollapsed ? toggle() : undefined),
            F2: () => canEdit && setIsRenaming(true),
            Delete: () => canEdit && void confirmDelete(item),
        }

        const action = actions[event.key]

        if (!action) {
            return
        }

        event.preventDefault()
        action()
    }

    function setColor(color: TagColor | undefined) {
        saveItem({
            ...item,
            color,
        })
    }

    return {
        canEdit,
        setColor,
        isCollapsed,
        isChosen,
        isRenaming,
        groupRef,
        children,
        styles,
        isContainer: container,
        ariaExpanded: container ? !isCollapsed : undefined,
        ariaSelected: hasChoice ? isChosen : isActive,
        dropZone: dropZone ?? undefined,
        isDragged: isDragged || undefined,
        isLanded: isLanded || undefined,
        draggable: !isRenaming,
        showGroup,
        showEmptyNote,
        showActions,
        showAddRequest,
        emptyText: `This ${item.kind} is empty`,
        renameLabel: `Rename ${item.name}`,
        addLabel: `Add request to ${item.name}`,
        actionsLabel: `Actions for ${item.name}`,
        drag,
        startRenaming,
        stopRenaming,
        saveName,
        usesSelectionMenu,
        prepareContextMenu,
        addRequest,
        keep,
        openBehind,
        stopClick,
        foldOnly,
        handleClick,
        handleKeyDown,
    }
}
