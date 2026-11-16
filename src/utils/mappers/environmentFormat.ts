import { newId } from '@/utils/common/id'
import { importCollection } from '@/utils/mappers/exportFormat'
import { MAX_NAME_LENGTH } from '#shared/limits.ts'
import type { Environment, Item, KeyValue } from '#shared/types.ts'

type Json = any

export type ImportedFile =
    | {
          kind: 'collection'
          items: Item[]
      }
    | {
          kind: 'environment'
          environment: Environment
      }

/** An environment file: `{ id, name, values: [{ key, value, type, enabled }] }`. */
export function exportEnvironment(environment: Environment): string {
    const values = environment.variables.map(({ key, value, type, enabled, description }) => {
        const pair: Json = {
            key,
            value,
        }

        if (type !== undefined) {
            pair.type = type
        }

        if (description !== undefined) {
            pair.description = description
        }

        pair.enabled = enabled

        return pair
    })

    return JSON.stringify(
        {
            id: environment.id,
            name: environment.name,
            values,
        },
        null,
        2,
    )
}

function toVariable(pair: Json): KeyValue {
    const row: KeyValue = {
        id: newId(),
        key: String(pair?.key ?? ''),
        value: pair?.value === null || pair?.value === undefined ? '' : String(pair.value),
        enabled: pair?.enabled !== false && !pair?.disabled,
    }

    if (typeof pair?.type === 'string') {
        row.type = pair.type
    }

    if (typeof pair?.description === 'string') {
        row.description = pair.description
    }

    return row
}

const isCollection = (data: Json) =>
    typeof data?.info?.name === 'string' && Array.isArray(data.item)

/** `values` is the environment file format; `variables` is what earlier versions exported. */
const environmentRows = (data: Json): unknown[] | undefined =>
    typeof data?.name !== 'string'
        ? undefined
        : [data.values, data.variables].find((rows) => Array.isArray(rows))

/**
 * Reads an exported file and tells a collection from an environment by its shape.
 * Collections get `order`; everything gets fresh ids. Throws when it is neither.
 */
export function importFile(text: string, order: number): ImportedFile {
    let data: Json

    try {
        data = JSON.parse(text)
    } catch {
        throw new Error('This file is not valid JSON.')
    }

    if (isCollection(data)) {
        return {
            kind: 'collection',
            items: importCollection(text, order),
        }
    }

    const rows = environmentRows(data)

    if (rows) {
        return {
            kind: 'environment',
            environment: {
                id: newId(),
                name: data.name.slice(0, MAX_NAME_LENGTH),
                variables: rows.map(toVariable),
            },
        }
    }

    throw new Error('This file is neither a collection (v2.1) nor an environment export.')
}
