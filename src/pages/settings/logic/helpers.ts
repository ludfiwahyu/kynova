export function parseWhole(text: string, min: number, max?: number): number | null {
    const next = Math.round(Number(text))

    if (!Number.isFinite(next)) {
        return null
    }

    return Math.min(Math.max(next, min), max ?? next)
}
