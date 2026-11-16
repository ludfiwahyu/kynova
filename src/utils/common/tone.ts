import { STATUS } from '#shared/http.ts'

export const TONES = {
    bad: 'bad',
    neutral: 'neutral',
    good: 'good',
} as const

export function statusTone(status: number | null): string {
    if (status === null || status >= STATUS.badRequest) {
        return TONES.bad
    }

    if (status >= STATUS.redirect) {
        return TONES.neutral
    }

    return TONES.good
}
