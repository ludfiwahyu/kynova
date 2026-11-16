import type { AutoClosing } from '@/settings'

export interface CloseBracketsConfig {
    brackets: string[]
    /** Characters in front of which an opening bracket gets its closing one. Whitespace always counts. */
    before: string
}

/** CodeMirror's default: close only before closing characters and punctuation, as VS Code's "languageDefined". */
const LANGUAGE_DEFINED_BEFORE = ')]}:;>,'
/** Every printable ASCII character: close whatever follows, as VS Code's "always". */
const ALWAYS_BEFORE = Array.from({ length: 95 }, (_, index) =>
    String.fromCharCode(32 + index),
).join('')

/**
 * Which characters close themselves, from the two VS Code-style settings.
 * One "before" rule covers both kinds, so "always" for either applies to both.
 */
export function closeBracketsConfig(
    brackets: AutoClosing,
    quotes: AutoClosing,
): CloseBracketsConfig {
    return {
        brackets: [
            ...(brackets === 'never' ? [] : ['(', '[', '{']),
            ...(quotes === 'never' ? [] : ['"', "'", '`']),
        ],
        before:
            brackets === 'always' || quotes === 'always' ? ALWAYS_BEFORE : LANGUAGE_DEFINED_BEFORE,
    }
}

/** Width of leading whitespace, with tabs to the next tab stop. */
export function leadingColumns(text: string, tabSize: number): number {
    let column = 0

    for (const char of text) {
        if (char === ' ') {
            column++
        } else if (char === '\t') {
            column += tabSize - (column % tabSize)
        } else {
            break
        }
    }

    return column
}

/**
 * Indentation for a new line in text without a grammar, as VS Code's
 * bracket rules do it: one level deeper after an opening bracket, one level
 * shallower when the line starts with a closing one.
 */
export function bracketIndentation(
    previousLine: string,
    textAfter: string,
    unit: number,
    tabSize: number,
): number {
    let column = leadingColumns(previousLine, tabSize)

    if (/[{[(]\s*$/.test(previousLine)) {
        column += unit
    }

    if (/^\s*[}\])]/.test(textAfter)) {
        column -= unit
    }

    return Math.max(0, column)
}
