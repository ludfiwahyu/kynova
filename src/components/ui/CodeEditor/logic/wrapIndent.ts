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

            const columns = indentColumns(line.text, state.tabSize)

            if (columns > 0) {
                // The first line is pulled back by what the padding added, so only the wrapped ones sit under the key.
                ranges.push(
                    Decoration.line({
                        attributes: {
                            style: `padding-left: calc(var(--space-2) + ${columns}ch); text-indent: -${columns}ch`,
                        },
                    }).range(line.from),
                )
            }
        }
    }

    return Decoration.set(ranges)
}

/**
 * With word wrap on, the lines that wrap start under the first character of their line,
 * never further left (VS Code's wrappingIndent "same"). Measured in `ch`, so it needs the monospace code font.
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
