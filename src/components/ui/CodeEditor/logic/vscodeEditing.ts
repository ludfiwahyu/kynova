import { selectParentSyntax, undoSelection } from '@codemirror/commands'
import { foldGutter, foldKeymap, foldService, matchBrackets } from '@codemirror/language'
import { openSearchPanel } from '@codemirror/search'
import type { EditorState, Extension } from '@codemirror/state'
import { countColumn, EditorSelection, Prec } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import {
    dropCursor,
    highlightSpecialChars,
    keymap,
    rectangularSelection,
    scrollPastEnd,
} from '@codemirror/view'

/** The chevron in the fold gutter: pointing down while open, right while folded, as in VS Code. */
function foldMarker(open: boolean): HTMLElement {
    const marker = document.createElement('span')

    marker.className = 'cm-fold-marker'
    marker.dataset.open = String(open)
    marker.title = open ? 'Fold line' : 'Unfold line'
    marker.innerHTML =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'

    return marker
}

/** ⇧⌘Enter: a new line above the current one, indented like it, with the cursor on it. */
function insertLineAbove(view: EditorView): boolean {
    if (view.state.readOnly) {
        return false
    }

    view.dispatch(
        view.state.changeByRange((range) => {
            const line = view.state.doc.lineAt(range.head)
            const indent = /^\s*/.exec(line.text)![0]

            return {
                changes: {
                    from: line.from,
                    insert: indent + '\n',
                },
                range: EditorSelection.cursor(line.from + indent.length),
            }
        }),
        {
            scrollIntoView: true,
            userEvent: 'input',
        },
    )

    return true
}

/**
 * Folding for text the grammar cannot read (JSON in single quotes or none): a line that ends in an
 * opening bracket folds up to its closing one.
 */
export const bracketFolding = foldService.of(
    (state: EditorState, lineStart: number, lineEnd: number) => {
        const text = state.doc.sliceString(lineStart, lineEnd).trimEnd()
        const last = text[text.length - 1]

        if (!last || !'{[('.includes(last)) {
            return null
        }

        const open = lineStart + text.length - 1
        const match = matchBrackets(state, open, 1)

        if (
            !match ||
            !match.matched ||
            !match.end ||
            state.doc.lineAt(match.end.from).number === state.doc.lineAt(open).number
        ) {
            return null
        }

        return {
            from: open + 1,
            to: match.end.from,
        }
    },
)

function indentWidth(text: string, tabSize: number): number {
    return countColumn(text, tabSize, text.length - text.trimStart().length)
}

/**
 * Folding by indentation, as VS Code does for languages without a grammar (HTML, XML, YAML,
 * snippets, text): a line folds over the deeper-indented lines after it, blank lines included.
 */
export const indentFolding = foldService.of((state: EditorState, lineStart: number) => {
    const line = state.doc.lineAt(lineStart)

    if (!line.text.trim()) {
        return null
    }

    const width = indentWidth(line.text, state.tabSize)
    let end = -1

    for (let number = line.number + 1; number <= state.doc.lines; number++) {
        const next = state.doc.line(number)

        if (!next.text.trim()) {
            continue
        }

        if (indentWidth(next.text, state.tabSize) <= width) {
            break
        }

        end = next.to
    }

    if (end === -1) {
        return null
    }

    return {
        from: line.to,
        to: end,
    }
})

export const vscodeEditing: Extension = [
    highlightSpecialChars(),
    dropCursor(),
    scrollPastEnd(),
    foldGutter({ markerDOM: foldMarker }),
    // Shift+Alt+drag makes a column selection, as in VS Code.
    rectangularSelection({ eventFilter: (event) => event.altKey && event.shiftKey }),
    Prec.high(
        keymap.of([
            {
                key: 'Mod-Shift-Enter',
                run: insertLineAbove,
                preventDefault: true,
            },
            {
                key: 'Shift-Alt-ArrowRight',
                run: selectParentSyntax,
                preventDefault: true,
            },
            {
                key: 'Shift-Alt-ArrowLeft',
                run: undoSelection,
                preventDefault: true,
            },
            // Cmd+H hides the window on a Mac, where VS Code uses ⌥⌘F.
            {
                key: 'Mod-h',
                mac: 'Mod-Alt-f',
                run: openSearchPanel,
                scope: 'editor search-panel',
                preventDefault: true,
            },
        ]),
    ),
    keymap.of(foldKeymap),
]
