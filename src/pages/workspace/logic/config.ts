import type { PanelId } from '@/pages/workspace/types'
import { definePage } from '@/utils'

export const workspacePage = definePage({
    id: 'workspace',
    title: 'Workspace',
    description: 'The workspace: its overview, members, and settings for owners.',
    tabs: [
        {
            id: 'overview',
            label: 'Overview',
        },
        {
            id: 'settings',
            label: 'Settings',
        },
    ],
})

export const ROLE_LABEL = {
    owner: 'Owner',
    editor: 'Editor',
    viewer: 'Viewer',
}

export const PANELS: {
    id: PanelId
    label: string
}[] = [
    {
        id: 'collections',
        label: 'Collections',
    },
    {
        id: 'environments',
        label: 'Environments',
    },
    {
        id: 'history',
        label: 'History',
    },
]

export const ACCENTS = ['#3b72e1', '#0b8a7a', '#7a4fd3', '#c2410c', '#be185d', '#4d7c0f']

export const NAME_ICON_SIZE = 15

export const THEME_ICON_SIZE = 14

export const MIN_NAME_SIZE = 8

export const NAME_SIZE_PADDING = 2

export const THEME_CHOICES = [
    {
        value: undefined,
        label: 'Personal',
    },
    {
        value: 'light',
        label: 'Light',
    },
    {
        value: 'dark',
        label: 'Dark',
    },
] as const
