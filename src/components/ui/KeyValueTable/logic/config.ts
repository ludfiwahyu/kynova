import type { ViewModeConfig } from '@/components/ui/KeyValueTable/types'

export const OFF_PREFIX = '//'

export const ADD_ICON_SIZE = 14

export const BULK_MIN_ROWS = 6

export const BULK_EXTRA_ROWS = 2

export const COLUMNS = {
    value: 'Value',
    description: 'Description',
}

export const MODE_ICON_SIZE = 13

/** The two ways to edit, in the order of the segmented control. */
export const VIEW_MODES: ViewModeConfig[] = [
    {
        mode: 'table',
        label: 'Table',
    },
    {
        mode: 'bulk',
        label: 'Bulk Edit',
    },
]
