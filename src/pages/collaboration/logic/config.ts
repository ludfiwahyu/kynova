export const FORMER_MEMBER_COLOR = '#7a8785'

export const MAX_SHOWN = 4

export const MAX_COMMENT_LENGTH = 5000

export const COMMENT_ICON_SIZE = 13

export const MEMBER_ICON_SIZE = 15

export const ROLE_SUMMARY = {
    editor: 'You will be able to edit requests, collections and environments.',
    viewer: 'You will be able to view and send requests, and to comment.',
}

export const ROLE_LABEL = {
    owner: 'Owner',
    editor: 'Editor',
    viewer: 'Viewer',
}

export const ROLE_OPTIONS = [
    {
        value: 'editor',
        label: 'Editor',
        hint: 'Can edit requests, collections and environments',
    },
    {
        value: 'viewer',
        label: 'Viewer',
        hint: 'Can send requests and comment',
    },
] as const

export const ROLE_ARTICLE = {
    editor: 'an editor',
    viewer: 'a viewer',
}
