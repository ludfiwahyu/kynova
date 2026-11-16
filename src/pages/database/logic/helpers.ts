import { KIND_NAME } from '@/pages/database/logic/config'
import type { DatabaseStatus } from '@/services'

export function hostOf(url: string): string {
    try {
        return new URL(url.trim()).hostname
    } catch {
        return ''
    }
}

export function databaseSummary(current: DatabaseStatus): string {
    if (current.kind === 'local') {
        return 'Local database'
    }

    return `${KIND_NAME[current.kind]} · ${current.detail}`
}
