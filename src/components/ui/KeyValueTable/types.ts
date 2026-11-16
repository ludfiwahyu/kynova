import type { useKeyValueTable } from '@/components/ui/KeyValueTable/hooks/useKeyValueTable'
import type { Variables } from '@/utils'
import type { KeyValue } from '#shared/types.ts'

// ===================================================================
//
//   Table
//
// ===================================================================

export interface KeyValueTableProps {
    rows: KeyValue[]
    onChange: (rows: KeyValue[]) => void
    disabled: boolean
    variables: Variables
    keyLabel?: string

    fixedKeys?: boolean
    /** False leaves out the Description column, for narrow places. */
    description?: boolean
}

export interface KeyValueTableOptions {
    rows: KeyValue[]
    onChange: (rows: KeyValue[]) => void
    disabled: boolean
    keyLabel: string
    fixedKeys: boolean
}

// ===================================================================
//
//   Rows
//
// ===================================================================

export interface RowLabels {
    toggle: string
    key: string
    value: string
    description: string
    remove: string
}

export interface RowPlaceholders {
    key: string
    value: string
    description: string
}

export interface RowView {
    row: KeyValue
    isBlank: boolean
    isOff: boolean
    canToggle: boolean
    canRemove: boolean
    description: string
    labels: RowLabels
    placeholders: RowPlaceholders
}

export interface RowViewOptions {
    blankId: string
    canAdd: boolean
    fixedKeys: boolean
    keyLabel: string
}

// ===================================================================
//
//   Bulk edit
//
// ===================================================================

export interface ParsedLine {
    enabled: boolean
    key: string
    value: string
}

// ===================================================================
//
//   Views
//
// ===================================================================

export type ViewMode = 'table' | 'bulk'

export interface ViewModeConfig {
    toggleLabel: string
    hint: string
}

export type KeyValueTableState = ReturnType<typeof useKeyValueTable>

export interface KeyValueViewProps {
    table: KeyValueTableState
    variables: Variables
    disabled: boolean
    keyLabel: string
    description: boolean
}

export interface BulkEditorProps {
    table: KeyValueTableState
}

export interface KeyValueRowProps {
    view: RowView
    variables: Variables
    disabled: boolean
    keyLocked: boolean
    description: boolean
    onUpdate: (row: KeyValue, changes: Partial<KeyValue>) => void
    onRemove: (row: KeyValue) => void
}
