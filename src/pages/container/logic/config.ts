import { definePage } from '@/utils'

export const containerPage = definePage({
    id: 'container',
    title: 'Collection or folder',
    description:
        'A collection or folder: its documentation, variables (collections only) and scripts.',
    tabs: [
        {
            id: 'overview',
            label: 'Overview',
        },
        {
            id: 'variables',
            label: 'Variables',
        },
        {
            id: 'scripts',
            label: 'Scripts',
        },
    ],
})

export const ICON_SIZE = 14

export const MIN_DESCRIPTION_ROWS = 8

export const MAX_DESCRIPTION_ROWS = 30

export const DESCRIPTION_ROW_PADDING = 2

export const DESCRIPTION_PLACEHOLDER =
    'Describe what this does. Markdown works: **bold**, `code`, lists and links.'
