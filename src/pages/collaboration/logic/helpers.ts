export function presenceLabel(count: number, itemId?: string): string {
    const noun = count === 1 ? 'person' : 'people'
    const where = itemId ? 'viewing this' : 'online'

    return `${count} other ${noun} ${where}`
}

export function memberCountLabel(count: number): string {
    return `${count} ${count === 1 ? 'member' : 'members'}`
}
