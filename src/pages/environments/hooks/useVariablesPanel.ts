import { useState } from 'react'

import { useActiveEnvironment } from '@/hooks'
import { definedIn, withValue } from '@/pages/environments/logic/variables'
import type { VariablesPanelProps } from '@/pages/environments/types'
import { saveEnvironment, saveItem, useCanEdit, useWorkspace } from '@/stores'
import { rootCollection, scopeVariables, usedVariables } from '@/utils'
import type { KeyValue } from '#shared/types.ts'

export function useVariablesPanel({ item }: VariablesPanelProps) {
    const environment = useActiveEnvironment()
    const collection = useWorkspace((state) =>
        item ? rootCollection(state.items, item) : undefined,
    )
    const canEdit = useCanEdit()
    const [showAll, setShowAll] = useState(true)

    const variables = scopeVariables(collection?.variables, environment?.variables)
    const names = item?.kind === 'http' ? usedVariables(JSON.stringify(item.request)) : []

    const used = names.map((name) => ({
        name,
        value: variables[name] ?? '',
        scope: definedIn(name, environment?.variables, collection?.variables),
    }))

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
        isRequest: item?.kind === 'http',
        showAll,
        toggleAll: () => setShowAll(!showAll),
        setValue,
        changeEnvironment,
        changeCollection,
    }
}
