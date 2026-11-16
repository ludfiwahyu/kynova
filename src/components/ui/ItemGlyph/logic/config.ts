import type { HttpMethod } from '#shared/types.ts'

export const SHORT_METHOD: Partial<Record<HttpMethod, string>> = {
    DELETE: 'DEL',
    OPTIONS: 'OPT',
}
