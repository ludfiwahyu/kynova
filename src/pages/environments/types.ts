import type { useEnvironmentRow } from '@/pages/environments/hooks/useEnvironmentRow'
import type { VariableScope } from '@/utils'
import type { Environment, Item } from '#shared/types.ts'

export interface EnvironmentRowProps {
    environment: Environment
}

export interface EnvironmentViewProps {
    environment: Environment
}

export type EnvironmentRowState = ReturnType<typeof useEnvironmentRow>

export interface EnvironmentMenuItemsProps {
    row: EnvironmentRowState
}

export interface VariablesPanelProps {
    item?: Item
}

export interface VariableRowProps {
    name: string
    value: string
    scope?: VariableScope
    disabled: boolean
    onCommit: (value: string) => void
}
