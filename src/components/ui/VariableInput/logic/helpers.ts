import {
    EDGE_MARGIN,
    FALLBACK_BADGE,
    FLOAT_GAP,
    FLOAT_WIDTH,
    SCOPE_BADGE,
    SCOPE_NAME,
    TOKEN,
} from '@/components/ui/VariableInput/logic/config'
import type { TextPart } from '@/components/ui/VariableInput/types'
import { DYNAMIC_VARIABLE_HINTS, type VariableEntry, type Variables } from '@/utils'

export function tokenKind(token: string, variables: Variables): 'variable' | 'unknown' | 'path' {
    if (token.startsWith(':')) {
        return 'path'
    }

    const name = token.slice(2, -2).trim()

    return name in variables || name.startsWith('$') ? 'variable' : 'unknown'
}

/** Splits the text into plain parts and the coloured `{{variable}}` / `:path` parts. */
export function splitParts(value: string, variables: Variables): TextPart[] {
    const parts: TextPart[] = []
    let end = 0

    for (const match of value.matchAll(TOKEN)) {
        if (match.index > end) {
            parts.push({ text: value.slice(end, match.index) })
        }

        parts.push({
            text: match[0],
            kind: tokenKind(match[0], variables),
        })
        end = match.index + match[0].length
    }

    if (end < value.length) {
        parts.push({ text: value.slice(end) })
    }

    return parts
}

let canvas: CanvasRenderingContext2D | null = null

/** Measures text as the input draws it. */
function measurer(style: CSSStyleDeclaration): CanvasRenderingContext2D {
    canvas ??= document.createElement('canvas').getContext('2d')!
    canvas.font = style.font

    return canvas
}

/** Where to draw something floating under character `index` of the input, on the screen. */
export function pointUnder(
    input: HTMLInputElement,
    index: number,
): {
    left: number
    top: number
} {
    const style = getComputedStyle(input)
    const context = measurer(style)

    const textWidth = context.measureText(input.value.slice(0, index)).width
    const rect = input.getBoundingClientRect()
    const left = rect.left + parseFloat(style.paddingLeft) + textWidth - input.scrollLeft

    return {
        left: Math.max(EDGE_MARGIN, Math.min(left, innerWidth - FLOAT_WIDTH)),
        top: rect.bottom + FLOAT_GAP,
    }
}

/** The character under the pointer at `clientX`. */
export function indexAt(input: HTMLInputElement, clientX: number): number {
    const style = getComputedStyle(input)
    const context = measurer(style)

    const x =
        clientX -
        input.getBoundingClientRect().left -
        parseFloat(style.paddingLeft) +
        input.scrollLeft

    // The first character whose middle is past the pointer.
    for (let index = 0; index < input.value.length; index++) {
        const before = context.measureText(input.value.slice(0, index)).width
        const after = context.measureText(input.value.slice(0, index + 1)).width

        if (x < after) {
            return x < before ? -1 : index
        }
    }

    return -1
}

/** Where floating parts render: the input's modal dialog, or the page. */
export function floatingContainer(input: HTMLElement | null): Element {
    return input?.closest('dialog[open]') ?? document.body
}

/** Without a page to say where they come from, the variables the field was given. */
export function fieldEntries(variables: Variables): VariableEntry[] {
    return [
        ...Object.entries(variables).map(([name, value]) => ({
            name,
            value,
        })),
        ...Object.entries(DYNAMIC_VARIABLE_HINTS).map(([name, value]) => ({
            name,
            value,
            scope: 'dynamic' as const,
        })),
    ]
}

/** The entry for the variable the pointer rests on, or the field's own value for it. */
export function entryNamed(
    entries: VariableEntry[],
    variables: Variables,
    name: string | undefined,
): VariableEntry | null {
    if (name === undefined) {
        return null
    }

    const found = entries.find((entry) => entry.name === name)

    if (found) {
        return found
    }

    return name in variables
        ? {
              name,
              value: variables[name],
          }
        : null
}

export function badgeOf(scope: VariableEntry['scope']) {
    return SCOPE_BADGE[scope ?? ''] ?? FALLBACK_BADGE
}

/** Where a variable comes from, as the details name it. */
export function scopeLabel(entry: VariableEntry, environmentName: string | undefined): string {
    if (entry.scope === 'environment' && environmentName) {
        return `${SCOPE_NAME.environment} · ${environmentName}`
    }

    return entry.scope ? SCOPE_NAME[entry.scope] : 'Variable'
}
