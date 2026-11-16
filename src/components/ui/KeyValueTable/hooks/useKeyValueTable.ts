import { useState } from 'react'

import { fromBulkText, toBulkText } from '@/components/ui/KeyValueTable/logic/bulkText'
import {
    BULK_EXTRA_ROWS,
    BULK_MIN_ROWS,
    VIEW_MODES,
} from '@/components/ui/KeyValueTable/logic/config'
import { appendRow, changeRow, removeRow } from '@/components/ui/KeyValueTable/logic/rows'
import { buildRowViews } from '@/components/ui/KeyValueTable/logic/rowViews'
import type { KeyValueTableOptions, ViewMode } from '@/components/ui/KeyValueTable/types'
import { newId } from '@/utils'
import type { KeyValue } from '#shared/types.ts'

export function useKeyValueTable({
    rows,
    onChange,
    disabled,
    keyLabel,
    fixedKeys,
}: KeyValueTableOptions) {
    // Rows

    const [blankId, setBlankId] = useState(newId)
    const [bulkText, setBulkText] = useState<string | null>(null)

    const canAdd = !disabled && !fixedKeys
    const keyLocked = disabled || fixedKeys

    const blank: KeyValue = {
        id: blankId,
        key: '',
        value: '',
        enabled: true,
    }

    const shownRows = canAdd ? [...rows, blank] : rows

    const rowViews = buildRowViews(shownRows, {
        blankId,
        canAdd,
        fixedKeys,
        keyLabel,
    })

    // Bulk edit

    const mode: ViewMode = bulkText === null ? 'table' : 'bulk'
    const { toggleLabel, hint } = VIEW_MODES[mode]
    const bulkLabel = `${keyLabel}s, one per line`
    const bulkRowCount = Math.max(BULK_MIN_ROWS, rows.length + BULK_EXTRA_ROWS)

    function toggleBulk() {
        setBulkText(mode === 'bulk' ? null : toBulkText(rows))
    }

    function changeBulk(text: string) {
        setBulkText(text)
        onChange(fromBulkText(text, rows))
    }

    // Editing rows

    function update(row: KeyValue, changes: Partial<KeyValue>) {
        if (row.id === blankId) {
            onChange(appendRow(rows, row, changes))
            setBlankId(newId())

            return
        }

        onChange(changeRow(rows, row.id, changes))
    }

    function remove(row: KeyValue) {
        onChange(removeRow(rows, row.id))
    }

    return {
        rowViews,
        keyLocked,
        mode,
        bulkText: bulkText ?? '',
        bulkLabel,
        bulkRowCount,
        toggleLabel,
        hint,
        toggleBulk,
        changeBulk,
        update,
        remove,
    }
}
