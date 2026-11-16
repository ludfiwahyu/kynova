import type { ReactNode } from 'react'

import type { useUi } from '@/stores'
import type { OptionalPanel, Workspace, WorkspaceSettings } from '#shared/types.ts'

export interface WorkspaceSectionProps {
    workspace: Workspace
}

export type PanelId = OptionalPanel | 'collections'

export type ThemeChoice = WorkspaceSettings['theme']

export interface ThemeOption {
    value: ThemeChoice
    label: string
    icon?: ReactNode
}

export interface PanelView {
    id: PanelId
    label: string
    isOn: boolean
    isLocked: boolean
    disabled: boolean
    switchLabel: string
}

export interface MemberLine {
    id: string
    name: string
    color: string
    roleLabel: string
}

export type WorkspaceSectionName = ReturnType<typeof useUi.getState>['workspaceSection']
