import { leadingColumns } from './editorRules'

export interface Bracket {
    pos: number
    /** Nesting level of the pair, from 0. */
    depth: number
    open: boolean
    /** Offset of the partner bracket, or -1 when there is none. */
    match: number
}

const OPENERS: Record<string, string> = {
    '{': '}',
    '[': ']',
    '(': ')',
}
const CLOSERS = new Set(Object.values(OPENERS))

/**
 * Finds the brackets that are code: those inside a string or a comment do not count.
 * Strings end at the end of their line, so one stray apostrophe cannot spoil the rest of the text.
 */
export function scanBrackets(text: string): Bracket[] {
    const found: Bracket[] = []
    const stack: {
        index: number
        closer: string
    }[] = []
    const length = text.length

    for (let pos = 0; pos < length; pos++) {
        const char = text[pos]

        if (char === '"' || char === "'" || char === '`') {
            pos++

            while (pos < length && text[pos] !== char && text[pos] !== '\n') {
                pos += text[pos] === '\\' ? 2 : 1
            }

            continue
        }

        if (char === '/' && text[pos + 1] === '/') {
            while (pos < length && text[pos] !== '\n') {
                pos++
            }

            continue
        }

        if (char === '/' && text[pos + 1] === '*') {
            const end = text.indexOf('*/', pos + 2)

            pos = end < 0 ? length : end + 1
            continue
        }

        if (char in OPENERS) {
            stack.push({
                index: found.length,
                closer: OPENERS[char],
            })
            found.push({
                pos,
                depth: stack.length - 1,
                open: true,
                match: -1,
            })
        } else if (CLOSERS.has(char)) {
            const top = stack[stack.length - 1]

            if (top && top.closer === char) {
                stack.pop()
                found[top.index].match = pos
                found.push({
                    pos,
                    depth: stack.length,
                    open: false,
                    match: found[top.index].pos,
                })
            } else {
                // Nothing to close, or the wrong kind: shown as a mistake.
                found.push({
                    pos,
                    depth: -1,
                    open: false,
                    match: -1,
                })
            }
        }
    }

    return found
}

/** The innermost pair around `pos` (an offset between characters): where it opens and closes. */
export function enclosingPair(
    brackets: Bracket[],
    pos: number,
): {
    open: number
    close: number
} | null {
    let best: {
        open: number
        close: number
    } | null = null

    for (const bracket of brackets) {
        if (bracket.pos >= pos) {
            break
        }

        if (bracket.open && bracket.match >= pos) {
            best = {
                open: bracket.pos,
                close: bracket.match,
            }
        }
    }

    return best
}

/**
 * How many indent guides each line gets. A blank line takes its guides from its nearest
 * neighbours with text, as VS Code does: one level deeper than the shallower of the two,
 * or their level when they match. So the guide of a block runs on unbroken through it.
 */
export function guideCounts(lines: string[], unit: number, tabSize: number): number[] {
    const columns = lines.map((line) => (line.trim() ? leadingColumns(line, tabSize) : -1))
    const above: number[] = []
    let last = 0

    for (const column of columns) {
        if (column >= 0) {
            last = column
        }

        above.push(last)
    }

    const counts: number[] = new Array(lines.length)
    let below = 0

    for (let index = lines.length - 1; index >= 0; index--) {
        if (columns[index] >= 0) {
            below = columns[index]
        }

        if (columns[index] >= 0) {
            counts[index] = Math.floor(columns[index] / unit)
            continue
        }

        const up = Math.floor(above[index] / unit)
        const down = Math.floor(below / unit)

        counts[index] = up === down ? down : Math.min(up, down) + 1
    }

    return counts
}
