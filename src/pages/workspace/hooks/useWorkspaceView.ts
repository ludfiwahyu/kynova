import type { KeyboardEvent } from 'react'
import { useRef, useState } from 'react'

import { useEnterAnimation } from '@/hooks'
import { MIN_NAME_SIZE, NAME_SIZE_PADDING } from '@/pages/workspace/logic/config'
import type { WorkspaceSectionName } from '@/pages/workspace/types'
import { renameWorkspace, useActiveWorkspace, useUi } from '@/stores'

export function useWorkspaceView() {
    const workspace = useActiveWorkspace()
    const section = useUi((state) => state.workspaceSection)

    const [nameDraft, setNameDraft] = useState(workspace?.name ?? '')
    const bodyRef = useRef<HTMLDivElement>(null)

    useEnterAnimation(bodyRef, section)

    const isOwner = workspace?.role === 'owner'
    const nameSize = Math.max(nameDraft.length + NAME_SIZE_PADDING, MIN_NAME_SIZE)

    function saveName() {
        if (!workspace) {
            return
        }

        const name = nameDraft.trim()

        if (name && name !== workspace.name) {
            void renameWorkspace(workspace.id, name)

            return
        }

        setNameDraft(workspace.name)
    }

    function handleNameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') {
            event.currentTarget.blur()
        }
    }

    function changeSection(next: WorkspaceSectionName) {
        useUi.setState({ workspaceSection: next })
    }

    return {
        workspace,
        section,
        bodyRef,
        isOwner,
        nameDraft,
        nameSize,
        setNameDraft,
        saveName,
        handleNameKeyDown,
        changeSection,
    }
}
