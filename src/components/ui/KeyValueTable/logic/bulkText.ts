import type { ParsedLine } from '@/components/ui/KeyValueTable/types'
import { newId } from '@/utils'
import type { KeyValue } from '#shared/types.ts'

import { OFF_PREFIX } from './config'

function lineOf(row: KeyValue): string {
    const prefix = row.enabled ? '' : OFF_PREFIX

    return `${prefix}${row.key}:${row.value}`
}

function parseLine(line: string): ParsedLine {
    const enabled = !line.startsWith(OFF_PREFIX)
    const content = enabled ? line : line.slice(OFF_PREFIX.length)
    const separator = content.indexOf(':')

    if (separator === -1) {
        return {
            enabled,
            key: content,
            value: '',
        }
    }

    return {
        enabled,
        key: content.slice(0, separator),
        value: content.slice(separator + 1),
    }
}

export function toBulkText(rows: KeyValue[]): string {
    return rows.map(lineOf).join('\n')
}

export function fromBulkText(text: string, previous: KeyValue[]): KeyValue[] {
    return text
        .split('\n')
        .filter((line) => line.trim())
        .map((line, index) => {
            const { enabled, key, value } = parseLine(line)
            const same = previous.find((row) => row.key === key) ?? previous[index]

            const row: KeyValue = {
                id: same?.id ?? newId(),
                key,
                value,
                enabled,
            }

            if (same?.key === key && same.description !== undefined) {
                row.description = same.description
            }

            return row
        })
}
