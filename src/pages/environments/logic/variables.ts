import type { VariableScope } from '@/utils'
import { newId } from '@/utils'
import type { KeyValue } from '#shared/types.ts'

const isEnabled = (rows: KeyValue[] | undefined, name: string) =>
    (rows ?? []).some((row) => row.enabled && row.key === name)

/** Where a name is defined: the environment wins over the collection. */
export function definedIn(
    name: string,
    environment: KeyValue[] | undefined,
    collection: KeyValue[] | undefined,
): VariableScope | undefined {
    if (isEnabled(environment, name)) {
        return 'environment'
    }

    return isEnabled(collection, name) ? 'collection' : undefined
}

/** The rows with `name` set to `value`: its row changes, or a new row is added at the end. */
export function withValue(rows: KeyValue[], name: string, value: string): KeyValue[] {
    if (isEnabled(rows, name)) {
        return rows.map((row) =>
            row.enabled && row.key === name
                ? {
                      ...row,
                      value,
                  }
                : row,
        )
    }

    return [
        ...rows,
        {
            id: newId(),
            key: name,
            value,
            enabled: true,
        },
    ]
}

/** Focuses and selects the value of `name` in the panel; false when it cannot take the focus yet. */
export function focusVariable(panel: HTMLElement, name: string): boolean {
    const row = [...panel.querySelectorAll<HTMLElement>('[data-variable-row]')].find(
        (candidate) => candidate.dataset.variableRow === name,
    )
    const input = row?.querySelector('input')

    if (!input) {
        return false
    }

    input.scrollIntoView({ block: 'nearest' })
    input.focus()
    input.select()

    return document.activeElement === input
}
