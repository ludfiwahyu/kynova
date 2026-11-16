import type { ItemsById } from '@/utils'

export function plural(count: number, word: string): string {
    return `${count} ${word}${count === 1 ? '' : 's'}`
}

export function countContents(
    items: ItemsById,
    parentId: string,
): {
    folders: number
    requests: number
} {
    const counts = {
        folders: 0,
        requests: 0,
    }

    function visit(id: string) {
        for (const child of Object.values(items)) {
            if (child.parentId !== id) {
                continue
            }

            if (child.kind === 'folder') {
                counts.folders++
            } else {
                counts.requests++
            }

            visit(child.id)
        }
    }

    visit(parentId)

    return counts
}

export function descriptionRows(text: string, min: number, max: number, padding: number): number {
    return Math.min(Math.max(text.split('\n').length + padding, min), max)
}
