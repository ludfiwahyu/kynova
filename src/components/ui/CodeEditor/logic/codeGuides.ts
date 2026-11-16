import { indentUnit } from '@codemirror/language'
import type { Extension, Range } from '@codemirror/state'
import type { DecorationSet, EditorView, ViewUpdate } from '@codemirror/view'
import { Decoration, ViewPlugin } from '@codemirror/view'

import type { Bracket } from './brackets'
import { enclosingPair, guideCounts, scanBrackets } from './brackets'

/** Above this the scan would be felt on every keystroke, so a very large body stays plain. */
const MAX_LENGTH = 400_000
const COLOURS = 3

const marks = [...Array(COLOURS)].map((_, level) =>
    Decoration.mark({ class: `cm-bracket-${level}` }),
)
const wrong = Decoration.mark({ class: 'cm-bracket-wrong' })

function build(view: EditorView, brackets: Bracket[], counts: number[]): DecorationSet {
    const { state } = view
    const doc = state.doc
    const ranges: Range<Decoration>[] = []
    const unitText = state.facet(indentUnit)
    const unit = unitText === '\t' ? state.tabSize : Math.max(1, unitText.length)

    // The pair around the cursor, and which guide of its lines is the strong one.
    let active: {
        from: number
        to: number
        level: number
    } | null = null
    const pair = enclosingPair(brackets, state.selection.main.head)

    if (pair) {
        const open = doc.lineAt(pair.open)
        const close = doc.lineAt(pair.close)

        if (open.number !== close.number) {
            const text = open.text
            let columns = 0

            for (const char of text) {
                if (char === ' ') {
                    columns++
                } else if (char === '\t') {
                    columns += state.tabSize - (columns % state.tabSize)
                } else {
                    break
                }
            }

            active = {
                from: open.number + 1,
                to: close.number - 1,
                level: Math.floor(columns / unit),
            }
        }
    }

    const seen = new Set<number>()

    for (const { from, to } of view.visibleRanges) {
        for (let pos = from; pos <= to;) {
            const line = doc.lineAt(pos)

            pos = line.to + 1

            if (seen.has(line.number)) {
                continue
            }

            seen.add(line.number)
            const count = counts[line.number - 1]

            if (!count) {
                continue
            }

            const strong =
                active &&
                line.number >= active.from &&
                line.number <= active.to &&
                active.level < count
                    ? active.level
                    : -1

            ranges.push(
                Decoration.line({
                    class: strong >= 0 ? 'cm-guides cm-guide-active' : 'cm-guides',
                    attributes: { style: `--guide-count:${count};--guide-active:${strong}` },
                }).range(line.from),
            )
        }

        // Brackets are found over the whole text, so each is coloured by its real level.
        for (const bracket of brackets) {
            if (bracket.pos < from) {
                continue
            }

            if (bracket.pos > to) {
                break
            }

            ranges.push(
                (bracket.depth < 0 ? wrong : marks[bracket.depth % COLOURS]).range(
                    bracket.pos,
                    bracket.pos + 1,
                ),
            )
        }
    }

    return Decoration.set(ranges, true)
}

const plugin = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet
        brackets: Bracket[] = []
        counts: number[] = []

        constructor(view: EditorView) {
            this.scan(view)
            this.decorations = build(view, this.brackets, this.counts)
        }

        scan(view: EditorView) {
            const { doc } = view.state

            if (doc.length > MAX_LENGTH) {
                this.brackets = []
                this.counts = []

                return
            }

            this.brackets = scanBrackets(doc.toString())
            const unitText = view.state.facet(indentUnit)

            this.counts = guideCounts(
                doc.toString().split('\n'),
                unitText === '\t' ? view.state.tabSize : Math.max(1, unitText.length),
                view.state.tabSize,
            )
        }

        update(update: ViewUpdate) {
            const reconfigured = update.transactions.some((transaction) => transaction.reconfigured)

            if (update.docChanged || reconfigured) {
                this.scan(update.view)
            }

            if (
                update.docChanged ||
                reconfigured ||
                update.selectionSet ||
                update.viewportChanged
            ) {
                this.decorations = build(update.view, this.brackets, this.counts)
            }
        }
    },
    { decorations: (instance) => instance.decorations },
)

export const codeGuides: Extension = plugin
