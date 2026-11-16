import type { KeyboardEvent, MouseEvent } from 'react'

import { useActiveEnvironment } from '@/hooks'
import { confirmDelete, downloadEnvironment } from '@/pages/environments/logic/helpers'
import {
    duplicateEnvironment,
    editNameSoon,
    keepTab,
    openTab,
    saveEnvironment,
    selectEnvironment,
    useCanEdit,
    useUi,
    useWorkspaceId,
} from '@/stores'
import type { Environment, TagColor } from '#shared/types.ts'

export function useEnvironmentRow(environment: Environment) {
    const workspaceId = useWorkspaceId()
    const canEdit = useCanEdit()
    const isActive = useActiveEnvironment()?.id === environment.id
    const isOpen = useUi(
        (state) => state.activeTab?.kind === 'environment' && state.activeTab.id === environment.id,
    )

    const tab = {
        kind: 'environment',
        id: environment.id,
    } as const

    const actionsLabel = `Actions for ${environment.name}`
    const toggleLabel = isActive ? 'Stop using' : 'Set as active'

    function open() {
        openTab(tab, { preview: true })
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

    function toggleActive() {
        selectEnvironment(workspaceId, isActive ? null : environment.id)
    }

    function setColor(color: TagColor | undefined) {
        saveEnvironment({
            ...environment,
            color,
        })
    }

    function rename() {
        openTab(tab)
        editNameSoon(environment.id)
    }

    function duplicate() {
        const copy = duplicateEnvironment(environment)

        openTab({
            kind: 'environment',
            id: copy.id,
        })
    }

    function exportFile() {
        downloadEnvironment(environment)
    }

    function remove() {
        void confirmDelete(environment)
    }

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        if (event.target === event.currentTarget && event.key === 'Enter') {
            openTab(tab)
        }
    }

    function stopClick(event: MouseEvent) {
        event.stopPropagation()
    }

    return {
        canEdit,
        color: environment.color,
        isActive,
        isOpen,
        actionsLabel,
        toggleLabel,
        open,
        keep,
        openBehind,
        toggleActive,
        setColor,
        rename,
        duplicate,
        exportFile,
        remove,
        handleKeyDown,
        stopClick,
    }
}
