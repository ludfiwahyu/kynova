import { useEffect, useRef, useState } from 'react'

import { useActiveEnvironment } from '@/hooks'
import { REVEAL_RETRY_MS } from '@/pages/environments/logic/config'
import { definedIn, focusVariable, withValue } from '@/pages/environments/logic/variables'
import type { VariablesPanelProps } from '@/pages/environments/types'
import {
    saveEnvironment,
    saveItem,
    useCanEdit,
    useUi,
    useWorkspace,
    variableRevealed,
} from '@/stores'
import { rootCollection, scopeVariables, usedVariables } from '@/utils'
import type { KeyValue } from '#shared/types.ts'

export function useVariablesPanel({ item }: VariablesPanelProps) {
    const environment = useActiveEnvironment()
    const collection = useWorkspace((state) =>
        item ? rootCollection(state.items, item) : undefined,
    )
    const canEdit = useCanEdit()
    const [showAll, setShowAll] = useState(true)
    const revealed = useUi((state) => state.revealedVariable)
    const ref = useRef<HTMLDivElement>(null)

    const variables = scopeVariables(collection?.variables, environment?.variables)
    const written = item?.kind === 'http' ? item.request : item
    const names = written ? usedVariables(JSON.stringify(written)) : []

    const used = names.map((name) => ({
        name,
        value: variables[name] ?? '',
        scope: definedIn(name, environment?.variables, collection?.variables),
    }))

    // A variable clicked in a field with ⌘ or Ctrl: its value takes the focus.
    useEffect(() => {
        if (!revealed || !ref.current) {
            return
        }

        const panel = ref.current

        // The panel may still be sliding in, and cannot take the focus until it has.
        if (!focusVariable(panel, revealed.name)) {
            setTimeout(() => focusVariable(panel, revealed.name), REVEAL_RETRY_MS)
        }

        variableRevealed()
    }, [revealed])

    function changeEnvironment(rows: KeyValue[]) {
        if (environment) {
            saveEnvironment({
                ...environment,
                variables: rows,
            })
        }
    }

    function changeCollection(rows: KeyValue[]) {
        if (collection) {
            saveItem({
                ...collection,
                variables: rows,
            })
        }
    }

    /** Changes the value where the name is defined; a new name goes to the environment, else the collection. */
    function setValue(name: string, value: string) {
        const scope = definedIn(name, environment?.variables, collection?.variables)

        if (scope === 'environment' || (!scope && environment)) {
            changeEnvironment(withValue(environment?.variables ?? [], name, value))
        } else {
            changeCollection(withValue(collection?.variables ?? [], name, value))
        }
    }

    return {
        canEdit,
        environment,
        collection,
        variables,
        used,
        ref,
        isRequest: item?.kind === 'http',
        showUsed: item?.kind === 'http' || used.length > 0,
        showAll,
        toggleAll: () => setShowAll(!showAll),
        setValue,
        changeEnvironment,
        changeCollection,
    }
}
