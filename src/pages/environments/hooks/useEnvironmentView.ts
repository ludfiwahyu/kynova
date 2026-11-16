import type { KeyboardEvent } from 'react'
import { useEffect, useRef, useState } from 'react'

import type { ButtonVariant } from '@/components'
import { useActiveEnvironment } from '@/hooks'
import { MIN_NAME_SIZE, NAME_SIZE_PADDING } from '@/pages/environments/logic/config'
import {
    keepTab,
    nameEdited,
    saveEnvironment,
    selectEnvironment,
    useCanEdit,
    useUi,
    useWorkspaceId,
} from '@/stores'
import { scopeVariables } from '@/utils'
import type { Environment, KeyValue } from '#shared/types.ts'

export function useEnvironmentView(environment: Environment) {
    const workspaceId = useWorkspaceId()
    const canEdit = useCanEdit()
    const isActive = useActiveEnvironment()?.id === environment.id
    const isNew = useUi((state) => state.editNameOf === environment.id)

    const [nameDraft, setNameDraft] = useState(environment.name)
    const nameRef = useRef<HTMLInputElement>(null)

    const nameSize = Math.max(nameDraft.length + NAME_SIZE_PADDING, MIN_NAME_SIZE)
    const toggleLabel = isActive ? 'Stop using' : 'Set as active'
    const toggleVariant: ButtonVariant = isActive ? 'default' : 'primary'
    const variables = scopeVariables(undefined, environment.variables)

    useEffect(() => {
        if (!isNew) {
            return
        }

        nameRef.current?.focus()
        nameRef.current?.select()
        nameEdited()
    }, [isNew])

    function saveName() {
        const name = nameDraft.trim()

        if (!name) {
            setNameDraft(environment.name)

            return
        }

        saveEnvironment({
            ...environment,
            name,
        })
    }

    function handleNameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') {
            event.currentTarget.blur()
        }
    }

    function toggleActive() {
        selectEnvironment(workspaceId, isActive ? null : environment.id)
    }

    function changeVariables(rows: KeyValue[]) {
        saveEnvironment({
            ...environment,
            variables: rows,
        })
    }

    function keepOpen() {
        keepTab({
            kind: 'environment',
            id: environment.id,
        })
    }

    return {
        canEdit,
        isActive,
        nameDraft,
        nameRef,
        nameSize,
        toggleLabel,
        toggleVariant,
        variables,
        setNameDraft,
        saveName,
        handleNameKeyDown,
        toggleActive,
        changeVariables,
        keepOpen,
    }
}
