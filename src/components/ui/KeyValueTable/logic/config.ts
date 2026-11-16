import type { ViewMode, ViewModeConfig } from '@/components/ui/KeyValueTable/types'

export const OFF_PREFIX = '//'

export const BULK_MIN_ROWS = 6

export const BULK_EXTRA_ROWS = 2

export const COLUMNS = {
    value: 'Value',
    description: 'Description',
}

const BULK_HINT = 'One per line, as key:value. Start a line with // to switch it off.'

export const VIEW_MODES: Record<ViewMode, ViewModeConfig> = {
    table: {
        toggleLabel: 'Bulk Edit',
        hint: '',
    },

    bulk: {
        toggleLabel: 'Key-Value Edit',
        hint: BULK_HINT,
    },
}
