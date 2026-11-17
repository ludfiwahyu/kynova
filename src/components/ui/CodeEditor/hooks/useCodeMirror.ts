import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { history, historyKeymap } from '@codemirror/commands'
import { bracketMatching, indentOnInput, syntaxHighlighting } from '@codemirror/language'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { Compartment, EditorState, type Extension, Transaction } from '@codemirror/state'
import {
    drawSelection,
    EditorView,
    highlightActiveLine,
    highlightActiveLineGutter,
    keymap,
    lineNumbers,
    placeholder as placeholderText,
} from '@codemirror/view'
import { useEffect, useMemo, useRef } from 'react'

import { codeGuides } from '@/components/ui/CodeEditor/logic/codeGuides'
import {
    editingRules,
    editorKeymap,
    languageExtension,
    tabKeymap,
    variableMarks,
} from '@/components/ui/CodeEditor/logic/extensions'
import { difference } from '@/components/ui/CodeEditor/logic/helpers'
import { highlight } from '@/components/ui/CodeEditor/logic/highlightStyle'
import { minimap } from '@/components/ui/CodeEditor/logic/minimap'
import { stringDoubleClick } from '@/components/ui/CodeEditor/logic/stringSelection'
import { vscodeEditing } from '@/components/ui/CodeEditor/logic/vscodeEditing'
import { wrapIndent } from '@/components/ui/CodeEditor/logic/wrapIndent'
import type { CodeEditorProps } from '@/components/ui/CodeEditor/types'
import { setPreferences, usePreferences } from '@/settings'

type Options = Pick<
    CodeEditorProps,
    | 'value'
    | 'onChange'
    | 'label'
    | 'disabled'
    | 'readOnly'
    | 'placeholder'
    | 'language'
    | 'variables'
    | 'onBlur'
>

/** ⌥Z on a Mac, Alt+Z on Windows: word wrap on or off in every editor, as VS Code's setting. */
const wordWrapKeymap = keymap.of([
    {
        key: 'Alt-z',
        preventDefault: true,
        run: () => {
            setPreferences({ wordWrap: !usePreferences.getState().wordWrap })

            return true
        },
    },
])

function editableExtension(disabled: boolean, readOnly: boolean): Extension {
    return [EditorView.editable.of(!disabled), EditorState.readOnly.of(disabled || readOnly)]
}

export function useCodeMirror({
    value,
    onChange,
    label,
    disabled = false,
    readOnly = false,
    placeholder = '',
    language = 'text',
    variables,
    onBlur,
}: Options) {
    const hostRef = useRef<HTMLDivElement>(null)
    const viewRef = useRef<EditorView | null>(null)
    const callbacks = useRef({
        onChange,
        onBlur,
    })
    const compartments = useRef({
        language: new Compartment(),
        rules: new Compartment(),
        editable: new Compartment(),
        placeholder: new Compartment(),
        variables: new Compartment(),
        label: new Compartment(),
        wrap: new Compartment(),
        doubleClick: new Compartment(),
    }).current
    const { indentSize, indentType, autoClosingBrackets, autoClosingQuotes, wordWrap } =
        usePreferences()

    callbacks.current = {
        onChange,
        onBlur,
    }

    const extensions = {
        language: useMemo(() => languageExtension(language), [language]),
        rules: useMemo(
            () =>
                editingRules({
                    indentSize,
                    indentType,
                    autoClosingBrackets,
                    autoClosingQuotes,
                }),
            [indentSize, indentType, autoClosingBrackets, autoClosingQuotes],
        ),
        editable: useMemo(() => editableExtension(disabled, readOnly), [disabled, readOnly]),
        placeholder: useMemo(
            () => (placeholder ? placeholderText(placeholder) : []),
            [placeholder],
        ),
        variables: useMemo(() => (variables ? variableMarks(variables) : []), [variables]),
        label: useMemo(() => EditorView.contentAttributes.of({ 'aria-label': label }), [label]),
        wrap: useMemo(() => (wordWrap ? [EditorView.lineWrapping, wrapIndent] : []), [wordWrap]),
        doubleClick: useMemo(() => stringDoubleClick(language), [language]),
    }

    // The editor is made once; later prop changes reconfigure it below.
    useEffect(() => {
        const view = new EditorView({
            parent: hostRef.current!,
            state: EditorState.create({
                doc: value,
                extensions: [
                    lineNumbers(),
                    highlightActiveLineGutter(),
                    highlightActiveLine(),
                    vscodeEditing,
                    minimap,
                    history(),
                    drawSelection(),
                    EditorState.allowMultipleSelections.of(true),
                    // ⌥-click adds a cursor, as in VS Code. With ⇧ too it is a column selection, which replaces the selection.
                    EditorView.clickAddsSelectionRange.of(
                        (event) => event.altKey && !event.shiftKey,
                    ),
                    indentOnInput(),
                    bracketMatching(),
                    codeGuides,
                    closeBrackets(),
                    highlightSelectionMatches(),
                    syntaxHighlighting(highlight),
                    tabKeymap,
                    wordWrapKeymap,
                    keymap.of([
                        ...closeBracketsKeymap,
                        ...editorKeymap,
                        ...searchKeymap,
                        ...historyKeymap,
                    ]),
                    compartments.language.of(extensions.language),
                    compartments.rules.of(extensions.rules),
                    compartments.editable.of(extensions.editable),
                    compartments.placeholder.of(extensions.placeholder),
                    compartments.variables.of(extensions.variables),
                    compartments.label.of(extensions.label),
                    compartments.wrap.of(extensions.wrap),
                    compartments.doubleClick.of(extensions.doubleClick),
                    EditorView.updateListener.of((update) => {
                        const fromOutside = update.transactions.every((transaction) =>
                            transaction.annotation(Transaction.remote),
                        )

                        if (update.docChanged && !fromOutside) {
                            callbacks.current.onChange(update.state.doc.toString())
                        }
                    }),
                    EditorView.domEventHandlers({
                        blur: (event, view) => {
                            // Moving into the editor's own find panel is not leaving it.
                            if (!view.dom.contains(event.relatedTarget as Node | null)) {
                                callbacks.current.onBlur?.()
                            }
                        },
                    }),
                ],
            }),
        })

        viewRef.current = view

        return () => {
            view.destroy()
            viewRef.current = null
        }
        // Made once on mount: every later change goes through the compartments below.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        viewRef.current?.dispatch({
            effects: [
                compartments.language.reconfigure(extensions.language),
                compartments.rules.reconfigure(extensions.rules),
                compartments.editable.reconfigure(extensions.editable),
                compartments.placeholder.reconfigure(extensions.placeholder),
                compartments.variables.reconfigure(extensions.variables),
                compartments.label.reconfigure(extensions.label),
                compartments.wrap.reconfigure(extensions.wrap),
                compartments.doubleClick.reconfigure(extensions.doubleClick),
            ],
        })
    }, [
        compartments,
        extensions.language,
        extensions.rules,
        extensions.editable,
        extensions.placeholder,
        extensions.variables,
        extensions.label,
        extensions.wrap,
        extensions.doubleClick,
    ])

    // A change from elsewhere (a collaborator, Beautify, another style) replaces only what differs.
    useEffect(() => {
        const view = viewRef.current
        const current = view?.state.doc.toString()

        if (!view || current === value) {
            return
        }

        view.dispatch({
            changes: difference(current!, value),
            annotations: Transaction.remote.of(true),
        })
    }, [value])

    return {
        hostRef,
        viewRef,
    }
}
