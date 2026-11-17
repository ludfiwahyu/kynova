import { EditorSelection } from '@codemirror/state'
import { EditorView } from '@codemirror/view'

import { stringAt } from '@/components/ui/CodeEditor/logic/stringAt'
import type { CodeLanguage } from '@/components/ui/CodeEditor/types'
import { usePreferences } from '@/settings'

/** The languages whose strings a double-click selects whole. */
const STRING_LANGUAGES: CodeLanguage[] = ['json', 'jsonLoose', 'javascript']

/**
 * Double-click on a key or a value in JSON or JavaScript selects the whole string, not one word of it.
 * Without quotes by default; Settings › Code Editor can include them. Anywhere else it is the usual word.
 */
export function stringDoubleClick(language: CodeLanguage) {
    if (!STRING_LANGUAGES.includes(language)) {
        return []
    }

    return EditorView.domEventHandlers({
        mousedown: (event, view) => {
            if (event.detail !== 2 || event.button !== 0 || event.altKey || event.shiftKey) {
                return false
            }

            const position = view.posAtCoords({
                x: event.clientX,
                y: event.clientY,
            })

            if (position === null) {
                return false
            }

            const line = view.state.doc.lineAt(position)
            const found = stringAt(line.text, position - line.from)

            if (!found) {
                return false
            }

            const withQuotes = usePreferences.getState().doubleClickSelectsQuotes
            const inner = found.end - found.start > 2

            // An empty string "" has nothing inside to select, so it keeps its quotes.
            const from = line.from + found.start + (withQuotes || !inner ? 0 : 1)
            const to = line.from + found.end - (withQuotes || !inner ? 0 : 1)

            view.dispatch({
                selection: EditorSelection.single(from, to),
                userEvent: 'select.pointer',
            })
            event.preventDefault()

            return true
        },
    })
}
