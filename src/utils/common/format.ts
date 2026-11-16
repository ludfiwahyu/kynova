import { KB, MB } from '#shared/units.ts'
export function formatBytes(bytes: number): string {
    if (bytes < KB) {
        return `${bytes} B`
    }

    if (bytes < MB) {
        return `${(bytes / KB).toFixed(1)} KB`
    }

    return `${(bytes / MB).toFixed(1)} MB`
}

export function formatDuration(ms: number): string {
    return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(2)} s`
}

const TIME = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
})
const DAY = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
})

export function formatTime(timestamp: number): string {
    return TIME.format(timestamp)
}

/** "Today", "Yesterday", or a full date. */
export function formatDay(timestamp: number): string {
    const startOfToday = new Date().setHours(0, 0, 0, 0)
    const daysAgo = Math.ceil((startOfToday - timestamp) / 86_400_000)

    if (daysAgo <= 0) {
        return 'Today'
    }

    if (daysAgo === 1) {
        return 'Yesterday'
    }

    return DAY.format(timestamp)
}

const SHORT_DAY = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
})

/** A short "when" for labels: "Today 11:46", "Yesterday 11:46", "14 Nov 11:46". */
export function formatWhen(timestamp: number): string {
    const day = formatDay(timestamp)
    const date = day === 'Today' || day === 'Yesterday' ? day : SHORT_DAY.format(timestamp)

    return `${date} ${formatTime(timestamp)}`
}

export function initials(name: string): string {
    const words = name.trim().split(/\s+/)

    return (words[0][0] + (words[1]?.[0] ?? '')).toUpperCase()
}
