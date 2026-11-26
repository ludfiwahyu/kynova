import type { UpdateAction, UpdateState } from '#shared/desktop.ts'

interface UpdateView {
    description: string
    button: string
    action: UpdateAction
    isBusy: boolean
}

const CHECK = {
    button: 'Check for updates',
    action: 'check',
    isBusy: false,
} as const

export function toUpdateView(state: UpdateState): UpdateView {
    switch (state.status) {
        case 'checking':
            return {
                ...CHECK,
                description: 'Looking for a newer version…',
                isBusy: true,
            }
        case 'latest':
            return {
                ...CHECK,
                description: 'You have the latest version.',
            }
        case 'available':
            return {
                description: `Version ${state.version} is available.`,
                button: 'Download',
                action: 'download',
                isBusy: false,
            }
        case 'downloading':
            return {
                description: `Downloading… ${state.percent}%`,
                button: 'Download',
                action: 'download',
                isBusy: true,
            }
        case 'ready':
            return {
                description: `Version ${state.version} is downloaded. It installs on restart or when you quit.`,
                button: 'Restart to update',
                action: 'install',
                isBusy: false,
            }
        case 'error':
            return {
                ...CHECK,
                description: state.message,
            }
        default:
            return {
                ...CHECK,
                description: 'Kynova looks for a newer version when it starts.',
            }
    }
}
