import type { RowView, RowViewOptions } from '@/components/ui/KeyValueTable/types'
import type { KeyValue } from '#shared/types.ts'

import { COLUMNS } from './config'

function buildRowView(row: KeyValue, options: RowViewOptions): RowView {
    const { blankId, canAdd, fixedKeys, keyLabel } = options

    const isBlank = row.id === blankId
    const name = row.key || keyLabel

    return {
        row,
        isBlank,
        isOff: !row.enabled,
        canToggle: !isBlank && !fixedKeys,
        canRemove: !isBlank && canAdd,
        description: row.description ?? '',

        labels: {
            toggle: `Use ${row.key || 'this row'}`,
            key: keyLabel,
            value: `Value of ${name}`,
            description: `Description of ${name}`,
            remove: `Remove ${row.key || 'row'}`,
        },

        placeholders: {
            key: isBlank ? keyLabel : '',
            value: isBlank ? COLUMNS.value : '',
            description: isBlank ? COLUMNS.description : '',
        },
    }
}

export function buildRowViews(rows: KeyValue[], options: RowViewOptions): RowView[] {
    return rows.map((row) => buildRowView(row, options))
}
