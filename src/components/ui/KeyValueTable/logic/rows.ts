import type { KeyValue } from '#shared/types.ts'

export function appendRow(
    rows: KeyValue[],
    blank: KeyValue,
    changes: Partial<KeyValue>,
): KeyValue[] {
    return [
        ...rows,
        {
            ...blank,
            ...changes,
        },
    ]
}

export function changeRow(rows: KeyValue[], id: string, changes: Partial<KeyValue>): KeyValue[] {
    return rows.map((existing) => {
        if (existing.id !== id) {
            return existing
        }

        return {
            ...existing,
            ...changes,
        }
    })
}

export function removeRow(rows: KeyValue[], id: string): KeyValue[] {
    return rows.filter((existing) => existing.id !== id)
}
