import { defaultKeymap, indentLess, indentMore } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { indentService, indentUnit } from '@codemirror/language'
import {
    type ChangeSpec,
    EditorState,
    type Extension,
    type Line,
    Prec,
    type Range,
    RangeSetBuilder,
} from '@codemirror/state'
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
import {
    isSnippetLanguage,
    snippetLanguage,
} from '@/components/ui/CodeEditor/logic/snippetLanguages'
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

const KEY_VALUE_MARKS = {
    key: Decoration.mark({ attributes: { 'data-token': 'key' } }),
    punctuation: Decoration.mark({ attributes: { 'data-token': 'punctuation' } }),
    value: Decoration.mark({ attributes: { 'data-token': 'string' } }),
}

/** A line switched off with `//`: everything on it in the muted comment colour, `{{variables}}` too. */
const OFF_LINE = Decoration.line({ attributes: { 'data-off': 'true' } })

/** One Bulk Edit line: `key:value`, or a whole line switched off by a leading `//`. */
function paintKeyValueLine(line: Line, builder: RangeSetBuilder<Decoration>) {
    const { text, from } = line

    if (!text.trim()) {
        return
    }

    if (text.startsWith('//')) {
        builder.add(from, from, OFF_LINE)

        return
    }

    const separator = text.indexOf(':')

    if (separator === -1) {
        builder.add(from, line.to, KEY_VALUE_MARKS.key)

        return
    }

    if (separator > 0) {
        builder.add(from, from + separator, KEY_VALUE_MARKS.key)
    }

    builder.add(from + separator, from + separator + 1, KEY_VALUE_MARKS.punctuation)

    if (separator + 1 < text.length) {
        builder.add(from + separator + 1, line.to, KEY_VALUE_MARKS.value)
    }
}

/** Colours Bulk Edit's `key:value` lines in the theme's key and string colours; only the lines in view. */
const keyValueColours = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet
        constructor(view: EditorView) {
            this.decorations = this.build(view)
        }
        update(update: ViewUpdate) {
            if (update.docChanged || update.viewportChanged) {
                this.decorations = this.build(update.view)
            }
        }
        build(view: EditorView): DecorationSet {
            const builder = new RangeSetBuilder<Decoration>()
            const { doc } = view.state
            let next = 0

            for (const { from, to } of view.visibleRanges) {
                let pos = Math.max(from, next)

                while (pos <= to) {
                    const line = doc.lineAt(pos)

                    paintKeyValueLine(line, builder)
                    next = line.to + 1
                    pos = next
                }
            }

            return builder.finish()
        }
    },
    { decorations: (instance) => instance.decorations },
)

/**
 * ⌘/ or Ctrl+/ in every editor: switches the chosen lines off with `//`, or back on when all of
 * them are off, as VS Code toggles comments. Empty lines are left alone, and a selection ending at
 * the start of a line leaves that line out. `atLineStart` (Bulk Edit) writes `//` with no space at
 * the very start, since Bulk Edit reads everything after it as the key; elsewhere it is `// ` at
 * the lines' shared indent.
 */
function lineToggle(atLineStart: boolean): Extension {
    const isOff = (text: string) => (atLineStart ? text : text.trimStart()).startsWith('//')

    return Prec.high(
        keymap.of([
            {
                key: 'Mod-/',
                run: (view) => {
                    const { state } = view

                    if (state.readOnly) {
                        return false
                    }

                    const numbers = new Set<number>()

                    for (const range of state.selection.ranges) {
                        const end = state.doc.lineAt(range.to)
                        const last =
                            range.to > range.from && range.to === end.from
                                ? end.number - 1
                                : end.number

                        for (
                            let number = state.doc.lineAt(range.from).number;
                            number <= last;
                            number++
                        ) {
                            numbers.add(number)
                        }
                    }

                    const lines = [...numbers]
                        .sort((a, b) => a - b)
                        .map((number) => state.doc.line(number))
                        .filter((line) => line.text.trim())

                    if (lines.length === 0) {
                        return true
                    }

                    const indentOf = (text: string) => text.length - text.trimStart().length
                    const allOff = lines.every((line) => isOff(line.text))
                    const column = atLineStart
                        ? 0
                        : Math.min(...lines.map((line) => indentOf(line.text)))

                    const changes = lines.flatMap((line): ChangeSpec[] => {
                        if (!allOff) {
                            return isOff(line.text) && atLineStart
                                ? []
                                : [
                                      {
                                          from: line.from + column,
                                          insert: atLineStart ? '//' : '// ',
                                      },
                                  ]
                        }

                        const from = line.from + (atLineStart ? 0 : indentOf(line.text))
                        const marker = line.text.slice(from - line.from).startsWith('// ') ? 3 : 2

                        return [
                            {
                                from,
                                to: from + (atLineStart ? 2 : marker),
                            },
                        ]
                    })

                    view.dispatch({
                        changes,
                        userEvent: 'input.comment',
                    })

                    return true
                },
            },
        ]),
    )
}

/** Lines switched off with `//`, muted, in every language but Bulk Edit's (only lines in view). */
const commentLines = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet
        constructor(view: EditorView) {
            this.decorations = this.build(view)
        }
        update(update: ViewUpdate) {
            if (update.docChanged || update.viewportChanged) {
                this.decorations = this.build(update.view)
            }
        }
        build(view: EditorView): DecorationSet {
            const builder = new RangeSetBuilder<Decoration>()
            const { doc } = view.state
            let next = 0

            for (const { from, to } of view.visibleRanges) {
                let pos = Math.max(from, next)

                while (pos <= to) {
                    const line = doc.lineAt(pos)
                    const indent = line.text.length - line.text.trimStart().length

                    if (line.text.startsWith('//', indent)) {
                        builder.add(line.from, line.from, OFF_LINE)
                    }

                    next = line.to + 1
                    pos = next
                }
            }

            return builder.finish()
        }
    },
    { decorations: (instance) => instance.decorations },
)

const toggleLines = lineToggle(false)

export function languageExtension(language: CodeLanguage): Extension {
    // Bracket rules for JSON too: the grammar indents half-typed JSON to the margin, VS Code keeps the line's indent.
    if (language === 'json') {
        return [json(), bracketIndent, commentLines, toggleLines]
    }

    if (language === 'jsonLoose') {
        return [
            bracketIndent,
            EditorState.languageData.of(() => [{ indentOnInput: /^\s*[}\])]$/ }]),
            looseJsonColours,
            bracketFolding,
            commentLines,
            toggleLines,
        ]
    }

    if (language === 'javascript') {
        return [javascript(), commentLines, toggleLines]
    }

    if (isSnippetLanguage(language)) {
        return snippetLanguage(language)
    }

    if (language === 'keyValue') {
        return [keyValueColours, lineToggle(true)]
    }

    return [
        bracketIndent,
        EditorState.languageData.of(() => [{ indentOnInput: /^\s*[}\])]$/ }]),
        commentLines,
        toggleLines,
    ]
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
