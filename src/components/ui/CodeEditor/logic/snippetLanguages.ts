import { StreamLanguage, type StreamParser } from '@codemirror/language'
import { c, clike, csharp, dart, java } from '@codemirror/legacy-modes/mode/clike'
import { go } from '@codemirror/legacy-modes/mode/go'
import { http } from '@codemirror/legacy-modes/mode/http'
import { python } from '@codemirror/legacy-modes/mode/python'
import { ruby } from '@codemirror/legacy-modes/mode/ruby'
import { shell } from '@codemirror/legacy-modes/mode/shell'

import type { CodeLanguage } from '@/components/ui/CodeEditor/types'

const words = (list: string) => Object.fromEntries(list.split(' ').map((word) => [word, true]))

/** PHP, enough for the generated snippets: keywords, strings, numbers, comments and `$variables`. */
const php = clike({
    name: 'php',
    keywords: words(
        'abstract and array as break case catch class clone const continue declare default do echo else elseif empty enddeclare endfor endforeach endif endswitch endwhile extends final finally fn for foreach function global goto if implements include include_once instanceof insteadof interface isset list match namespace new or print private protected public readonly require require_once return static switch throw trait try unset use var while xor yield',
    ),
    atoms: words('true false null TRUE FALSE NULL'),
    hooks: {
        $: (stream: { eatWhile: (pattern: RegExp) => boolean }) => {
            stream.eatWhile(/[\w]/)

            return 'variable-2'
        },
    },
})

/** The code snippet languages, coloured by small stream parsers (read-only, no editing rules). */
export type SnippetCodeLanguage = Extract<
    CodeLanguage,
    'shell' | 'python' | 'ruby' | 'go' | 'c' | 'csharp' | 'java' | 'dart' | 'php' | 'http'
>

const PARSERS: Record<SnippetCodeLanguage, StreamParser<unknown>> = {
    shell: shell as StreamParser<unknown>,
    python: python as StreamParser<unknown>,
    ruby: ruby as StreamParser<unknown>,
    go: go as StreamParser<unknown>,
    c,
    csharp,
    java,
    dart,
    php,
    http: http as StreamParser<unknown>,
}

const languages = new Map<SnippetCodeLanguage, StreamLanguage<unknown>>()

export const isSnippetLanguage = (language: CodeLanguage): language is SnippetCodeLanguage =>
    language in PARSERS

/** Made once per language, the first time a snippet in it is shown. */
export function snippetLanguage(language: SnippetCodeLanguage): StreamLanguage<unknown> {
    let made = languages.get(language)

    if (!made) {
        made = StreamLanguage.define(PARSERS[language])
        languages.set(language, made)
    }

    return made
}
