import { defaultKeymap, indentLess, indentMore } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { indentService, indentUnit } from '@codemirror/language'
import { EditorState, type Extension, Prec, type Range } from '@codemirror/state'
import {
    Decoration,
    type DecorationSet,
    type EditorView,
    keymap,
    MatchDecorator,
    ViewPlugin,
    type ViewUpdate,
} from '@codemirror/view'

import { MAX_COLOURED_LENGTH } from '@/components/ui/CodeEditor/logic/config'
import {
    bracketIndentation,
    closeBracketsConfig,
} from '@/components/ui/CodeEditor/logic/editorRules'
import { bracketFolding } from '@/components/ui/CodeEditor/logic/vscodeEditing'
import type { CodeLanguage, EditingPreferences } from '@/components/ui/CodeEditor/types'
import { highlightStyled, tokenKind, type Variables } from '@/utils'

/** Indentation by brackets, for text without a grammar (and JSON written without quotes). */
const bracketIndent = indentService.of((context, pos) => {
    let line = context.lineAt(pos, -1)
    let previous = line.text

    // Indenting an empty line, or a break at its start: go by the nearest line above with text.
    while (!previous.trim() && line.from > 0) {
        line = context.lineAt(line.from - 1, -1)
        previous = line.text
    }

    return bracketIndentation(
        previous,
        context.textAfterPos(pos),
        context.unit,
        context.state.tabSize,
    )
})

/** Colours JSON written in single quotes or none, which the JSON grammar cannot read, with the same colours per type of value. */
const looseJsonColours = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet
        constructor(view: EditorView) {
            this.decorations = this.build(view)
        }
        update(update: ViewUpdate) {
            if (update.docChanged) {
                this.decorations = this.build(update.view)
            }
        }
        build(view: EditorView): DecorationSet {
            const text = view.state.doc.toString()

            if (text.length > MAX_COLOURED_LENGTH) {
                return Decoration.none
            }

            const ranges: Range<Decoration>[] = []
            let pos = 0

            for (const token of highlightStyled(text)) {
                const kind = tokenKind(token)

                // Plain text and {{variables}} keep their own look.
                if (kind !== 'plain' && kind !== 'variable') {
                    ranges.push(
                        Decoration.mark({ attributes: { 'data-token': kind } }).range(
                            pos,
                            pos + token.text.length,
                        ),
                    )
                }

                pos += token.text.length
            }

            return Decoration.set(ranges)
        }
    },
    { decorations: (instance) => instance.decorations },
)

export function languageExtension(language: CodeLanguage): Extension {
    // Bracket rules for JSON too: the grammar indents half-typed JSON to the margin, VS Code keeps the line's indent.
    if (language === 'json') {
        return [json(), bracketIndent]
    }

    if (language === 'jsonLoose') {
        return [
            bracketIndent,
            EditorState.languageData.of(() => [{ indentOnInput: /^\s*[}\])]$/ }]),
            looseJsonColours,
            bracketFolding,
        ]
    }

    if (language === 'javascript') {
        return javascript()
    }

    return [bracketIndent, EditorState.languageData.of(() => [{ indentOnInput: /^\s*[}\])]$/ }])]
}

/** Tab: an indent at the cursor, or the selected lines one level deeper; Shift+Tab: one level shallower. */
export const tabKeymap = keymap.of([
    {
        key: 'Tab',
        run: (view) => {
            if (view.state.readOnly) {
                return false
            }

            if (view.state.selection.ranges.some((range) => !range.empty)) {
                return indentMore(view)
            }

            view.dispatch(view.state.replaceSelection(view.state.facet(indentUnit)), {
                scrollIntoView: true,
                userEvent: 'input',
            })

            return true
        },
        shift: indentLess,
    },
])

export function editingRules(preferences: EditingPreferences): Extension {
    const config = closeBracketsConfig(
        preferences.autoClosingBrackets,
        preferences.autoClosingQuotes,
    )

    return [
        EditorState.tabSize.of(preferences.indentSize),
        indentUnit.of(preferences.indentType === 'tab' ? '\t' : ' '.repeat(preferences.indentSize)),
        // Ahead of the language's own setting, so these settings win.
        Prec.highest(EditorState.languageData.of(() => [{ closeBrackets: config }])),
    ]
}

export function variableMarks(variables: Variables): Extension {
    const decorator = new MatchDecorator({
        regexp: /\{\{\s*([^{}]+?)\s*\}\}/g,
        decoration: (match) =>
            Decoration.mark({
                attributes: {
                    'data-token':
                        match[1] in variables || match[1].startsWith('$') ? 'variable' : 'unknown',
                },
            }),
    })

    return ViewPlugin.define(
        (view) => ({
            decorations: decorator.createDeco(view),
            update(update: ViewUpdate) {
                this.decorations = decorator.updateDeco(update, this.decorations)
            },
        }),
        { decorations: (plugin) => plugin.decorations },
    )
}

/** Mod-Enter sends the request, so it must not also insert a blank line here. */
export const editorKeymap = defaultKeymap.filter((binding) => binding.key !== 'Mod-Enter')
