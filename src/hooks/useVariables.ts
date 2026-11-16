import { useMemo } from 'react'

import type { VariableContextValue } from '@/components'
import { saveEnvironment, saveItem, useCanEdit, useWorkspace } from '@/stores'
import type { Variables } from '@/utils'
import { rootCollection, scopeVariables, variableEntries } from '@/utils'
import type { Item } from '#shared/types.ts'

import { useActiveEnvironment } from './useActiveEnvironment'

/** The variables `item` can use: its collection's, overridden by the active environment's. */
export function useVariables(item: Item): Variables {
    const environment = useActiveEnvironment()
    const collection = useWorkspace((state) => rootCollection(state.items, item))

    return useMemo(
        () => scopeVariables(collection?.variables, environment?.variables),
        [collection?.variables, environment?.variables],
    )
}

/**
 * What the variable fields of `item`'s page suggest and show: every variable with where
 * it comes from, and, for editors, a way to change a value where it is defined.
 */
export function useVariableContext(item: Item): VariableContextValue {
    const environment = useActiveEnvironment()
    const collection = useWorkspace((state) => rootCollection(state.items, item))
    const canEdit = useCanEdit()

    return useMemo(
        () => ({
            entries: variableEntries(collection?.variables, environment?.variables),
            environmentName: environment?.name,
            setValue: canEdit
                ? (entry, value) => {
                      const change = (rows = environment?.variables ?? []) =>
                          rows.map((row) =>
                              row.enabled && row.key === entry.name
                                  ? {
                                        ...row,
                                        value,
                                    }
                                  : row,
                          )

                      if (entry.scope === 'environment' && environment) {
                          saveEnvironment({
                              ...environment,
                              variables: change(environment.variables),
                          })
                      } else if (entry.scope === 'collection' && collection) {
                          saveItem({
                              ...collection,
                              variables: change(collection.variables),
                          })
                      }
                  }
                : undefined,
        }),
        [collection, environment, canEdit],
    )
}
