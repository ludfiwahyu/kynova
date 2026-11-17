import type { Extension, Range } from '@codemirror/state'
import {
    Decoration,
    type DecorationSet,
    type EditorView,
    ViewPlugin,
    type ViewUpdate,
} from '@codemirror/view'

/** How many columns of white space a line starts with; a tab counts to the next tab stop. */
export function indentColumns(text: string, tabSize: number): number {
    let columns = 0

    for (const character of text) {
        if (character === ' ') {
            columns += 1
        } else if (character === '\t') {
            columns += tabSize - (columns % tabSize)
        } else {
            break
        }
    }

    return columns
}

const hangs = new Map<number, Decoration>()

/**
 * A line's wrapped rows start one indent unit right of its first character, so they never reach
 * left into the indent guides. The first row is pulled back by the same amount. The guides are
 * placed from `--line-pad`, not from the text, so this padding does not move them.
 */
function hang(columns: number): Decoration {
    let decoration = hangs.get(columns)

    if (!decoration) {
        decoration = Decoration.line({
            attributes: {
                style: `padding-left: calc(var(--line-pad) + ${columns}ch + var(--guide-unit)); text-indent: calc(-${columns}ch - var(--guide-unit))`,
            },
        })
        hangs.set(columns, decoration)
    }

    return decoration
}

function build(view: EditorView): DecorationSet {
    const { state } = view
    const ranges: Range<Decoration>[] = []
    let last = -1

    for (const { from, to } of view.visibleRanges) {
        for (let position = from; position <= to;) {
            const line = state.doc.lineAt(position)

            position = line.to + 1

            if (line.from === last) {
                continue
            }

            last = line.from
            ranges.push(hang(indentColumns(line.text, state.tabSize)).range(line.from))
        }
    }

    return Decoration.set(ranges)
}

/**
 * With word wrap on, a long line wraps at the edge of the text area (before the minimap), and
 * its wrapped rows start one indent unit right of the line's first character, like VS Code's
 * wrappingIndent "indent". Measured in `ch`, so it needs the monospace code font.
 */
export const wrapIndent: Extension = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet

        constructor(view: EditorView) {
            this.decorations = build(view)
        }

        update(update: ViewUpdate) {
            if (update.docChanged || update.viewportChanged) {
                this.decorations = build(update.view)
            }
        }
    },
    { decorations: (plugin) => plugin.decorations },
)
