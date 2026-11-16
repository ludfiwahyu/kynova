import { highlightJson, type JsonToken } from './highlightJson'

export type JsonStyle = 'double' | 'single' | 'bare'

export const JSON_STYLES: {
    id: JsonStyle
    label: string
    example: string
}[] = [
    {
        id: 'double',
        label: 'Double quotes',
        example: '"key": "value"',
    },
    {
        id: 'single',
        label: 'Single quotes',
        example: "'key': 'value'",
    },
    {
        id: 'bare',
        label: 'No quotes',
        example: 'key: value',
    },
]

type Token =
    | {
          /** `comment`: a line switched off with `//` (⌘/), up to the end of the line. */
          kind: 'space' | 'punct' | 'comment'
          text: string
      }
    | {
          kind: 'string'
          text: string
          value: string
          quote: '"' | "'" | ''
          isKey: boolean
      }
    | {
          kind: 'number' | 'literal' | 'variable'
          text: string
          isKey: boolean
      }

const NUMBER = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/
const LITERAL = /^(?:true|false|null)$/
const VARIABLE = /\{\{[^{}\n]*\}\}/y
const WHOLE_VARIABLE = /^\{\{[^{}\n]*\}\}$/
const DOUBLE_QUOTED = /"(?:\\.|[^"\\\n])*"/y
const SINGLE_QUOTED = /'(?:\\.|[^'\\\n])*'/y

class NotJson extends Error {}

/** Turns the body of a single-quoted string into the value it stands for. */
function decodeSingleQuoted(inner: string): string {
    let json = ''

    for (let i = 0; i < inner.length; i++) {
        const char = inner[i]

        if (char === '\\' && inner[i + 1] === "'") {
            json += "'"
            i++
        } else if (char === '\\') {
            json += char + (inner[i + 1] ?? '')
            i++
        } else {
            json += char === '"' ? '\\"' : char
        }
    }

    return JSON.parse(`"${json}"`)
}

/** Splits text into tokens, or throws `NotJson` when it is not JSON in any style. */
function tokenize(text: string): Token[] {
    const tokens: Token[] = []
    let i = 0

    const fail = (): never => {
        throw new NotJson()
    }

    /** Whitespace, and `//` comments to the end of their line, wherever whitespace may be. */
    function space() {
        while (i < text.length) {
            const start = i

            while (i < text.length && /\s/.test(text[i])) {
                i++
            }

            if (i > start) {
                tokens.push({
                    kind: 'space',
                    text: text.slice(start, i),
                })
            }

            if (!text.startsWith('//', i)) {
                return
            }

            const lineEnd = text.indexOf('\n', i)
            const stop = lineEnd === -1 ? text.length : lineEnd

            tokens.push({
                kind: 'comment',
                text: text.slice(i, stop),
            })
            i = stop
        }
    }

    function punct(char: string) {
        if (text[i] !== char) {
            fail()
        }

        tokens.push({
            kind: 'punct',
            text: char,
        })
        i++
    }

    function quoted(pattern: RegExp, isKey: boolean) {
        pattern.lastIndex = i
        const match = pattern.exec(text) ?? fail()
        const raw = match[0]
        let value: string

        try {
            value = raw[0] === '"' ? JSON.parse(raw) : decodeSingleQuoted(raw.slice(1, -1))
        } catch {
            return fail()
        }

        tokens.push({
            kind: 'string',
            text: raw,
            value,
            quote: raw[0] as '"' | "'",
            isKey,
        })
        i += raw.length
    }

    /** A word without quotes: up to the end of the line or the next separator. A key also ends at `:`. */
    function bare(isKey: boolean) {
        const start = i
        const stops = isKey ? ':,{}[]\n\r' : ',}]\n\r'

        while (i < text.length) {
            VARIABLE.lastIndex = i

            if (VARIABLE.test(text)) {
                i = VARIABLE.lastIndex
            } else if (stops.includes(text[i])) {
                break
            } else {
                i++
            }
        }

        while (i > start && /\s/.test(text[i - 1])) {
            i--
        }

        const word = text.slice(start, i)

        if (word === '') {
            fail()
        }

        if (WHOLE_VARIABLE.test(word)) {
            tokens.push({
                kind: 'variable',
                text: word,
                isKey,
            })
        } else if (!isKey && NUMBER.test(word)) {
            tokens.push({
                kind: 'number',
                text: word,
                isKey,
            })
        } else if (!isKey && LITERAL.test(word)) {
            tokens.push({
                kind: 'literal',
                text: word,
                isKey,
            })
        } else {
            tokens.push({
                kind: 'string',
                text: word,
                value: word,
                quote: '',
                isKey,
            })
        }
    }

    function scalar(isKey: boolean) {
        const char = text[i]

        if (char === '"') {
            quoted(DOUBLE_QUOTED, isKey)
        } else if (char === "'") {
            quoted(SINGLE_QUOTED, isKey)
        } else if (char === undefined || ('{}[],:'.includes(char) && !text.startsWith('{{', i))) {
            fail()
        } else {
            bare(isKey)
        }
    }

    /** The members of an object or the items of an array, up to `close`. A trailing comma is allowed. */
    function members(close: '}' | ']', member: () => void) {
        space()

        while (text[i] !== close) {
            member()

            if (text[i] !== ',') {
                break
            }

            punct(',')
            space()
        }

        punct(close)
    }

    function value() {
        space()

        if (text[i] === '{' && !text.startsWith('{{', i)) {
            punct('{')
            members('}', () => {
                scalar(true)
                space()
                punct(':')
                value()
            })
        } else if (text[i] === '[') {
            punct('[')
            members(']', value)
        } else {
            scalar(false)
        }

        space()
    }

    value()

    if (i < text.length) {
        fail()
    }

    return tokens
}

function tryTokenize(text: string): Token[] | null {
    try {
        return tokenize(text)
    } catch (error) {
        if (error instanceof NotJson) {
            return null
        }

        throw error
    }
}

/**
 * A comma with only space before the closing bracket. JSON does not allow it.
 * A comment in between keeps the comma: switching that line back on needs it.
 */
function isTrailingComma(tokens: Token[], index: number): boolean {
    if (tokens[index].text !== ',' || tokens[index].kind !== 'punct') {
        return false
    }

    let next = index + 1

    while (tokens[next]?.kind === 'space') {
        next++
    }

    return (
        tokens[next]?.kind === 'punct' && (tokens[next].text === '}' || tokens[next].text === ']')
    )
}

function singleQuote(value: string): string {
    const escaped = JSON.stringify(value).slice(1, -1).replace(/\\"/g, '"').replace(/'/g, "\\'")

    return `'${escaped}'`
}

/** Whether a string reads back as the same string without quotes. */
function fitsBare(value: string, isKey: boolean): boolean {
    // Control characters cannot appear in a bare string.
    // eslint-disable-next-line no-control-regex
    if (value === '' || value !== value.trim() || /[\u0000-\u001f,{}[\]]/.test(value)) {
        return false
    }

    if (`"':`.includes(value[0]) || value.includes('{{')) {
        return false
    }

    if (isKey) {
        return !value.includes(':')
    }

    return !NUMBER.test(value) && !LITERAL.test(value)
}

function writeString(token: Extract<Token, { kind: 'string' }>, style: JsonStyle): string {
    if (style === 'single') {
        return token.quote === "'" ? token.text : singleQuote(token.value)
    }

    if (style === 'bare' && fitsBare(token.value, token.isKey)) {
        return token.value
    }

    // Double quotes, and strings that need quotes in the bare style.
    return token.quote === '"' ? token.text : JSON.stringify(token.value)
}

/** Whitespace only, which every style leaves alone. */
const isBlank = (text: string) => text.trim() === ''

/**
 * Text in any style as plain JSON, or null when it is not JSON. Keeps spacing and line breaks,
 * and `//` lines, which only `toSendableJson` takes out.
 */
export function toJson(text: string): string | null {
    if (isBlank(text)) {
        return text
    }

    const tokens = tryTokenize(text)

    if (!tokens) {
        return null
    }

    return tokens
        .map((token, index) => {
            if (isTrailingComma(tokens, index)) {
                return ''
            }

            return token.kind === 'string' ? writeString(token, 'double') : token.text
        })
        .join('')
}

/** JSON (or text in any style) written in `style`, or null when it is not JSON. Keeps spacing and line breaks. */
export function toStyle(text: string, style: JsonStyle): string | null {
    if (isBlank(text)) {
        return text
    }

    const tokens = tryTokenize(text)

    if (!tokens) {
        return null
    }

    return tokens
        .map((token) => (token.kind === 'string' ? writeString(token, style) : token.text))
        .join('')
}

/**
 * Lays out JSON in any style one member per line, written in `style`. Null when it is not JSON.
 * With `trailingComma` the last member of every object and array ends in a comma, as in JavaScript.
 */
export function formatJson(
    text: string,
    style: JsonStyle,
    indent = '  ',
    trailingComma = false,
): string | null {
    const tokens = tryTokenize(text)?.filter((token) => token.kind !== 'space')

    if (!tokens) {
        return null
    }

    let out = ''
    let depth = 0
    let afterComment = false
    const newLine = () => '\n' + indent.repeat(depth)

    for (let index = 0; index < tokens.length; index++) {
        const token = tokens[index]

        // A `//` line keeps a line of its own, at the depth where it stands.
        if (token.kind === 'comment') {
            if (out && !/\n[ \t]*$/.test(out)) {
                out += newLine()
            }

            out += token.text + newLine()
            afterComment = true

            continue
        }

        const wasAfterComment = afterComment

        afterComment = false

        if (token.kind === 'string') {
            out += writeString(token, style)
        } else if (token.kind !== 'punct') {
            out += token.text
        } else if (token.text === '{' || token.text === '[') {
            const next = tokens[index + 1]

            if (next.text === (token.text === '{' ? '}' : ']') && next.kind === 'punct') {
                out += token.text + next.text
                index++
            } else {
                depth++
                out += token.text + newLine()
            }
        } else if (token.text === '}' || token.text === ']') {
            depth--

            // After a `//` line the member before it already ends in its comma.
            if (trailingComma && !wasAfterComment) {
                out += ','
            }

            out = out.replace(/\n[ \t]*$/, '')
            out += newLine() + token.text
        } else if (token.text === ',') {
            if (!isTrailingComma(tokens, index)) {
                out += ',' + newLine()
            }
        } else {
            out += ' : '
        }
    }

    return out
}

/** Coloured tokens for JSON in any style. Text that is not JSON gets the plain JSON colouring. */
export function highlightStyled(text: string): JsonToken[] {
    const tokens = tryTokenize(text)

    if (!tokens) {
        return highlightJson(text)
    }

    return tokens.map((token): JsonToken => {
        if (token.kind === 'comment') {
            return {
                text: token.text,
                kind: 'comment',
            }
        }

        if (token.kind === 'space' || token.kind === 'punct') {
            return {
                text: token.text,
                kind: 'plain',
            }
        }

        if (token.kind === 'string') {
            return {
                text: token.text,
                kind: token.isKey ? 'key' : 'string',
            }
        }

        return {
            text: token.text,
            kind: token.kind,
        }
    })
}

/** A line whose first characters are `//`: switched off with ⌘/ or Ctrl+/. */
const COMMENT_LINE = /^[ \t]*\/\/.*(?:\r?\n|$)/gm

/**
 * A JSON body as it is sent: `//` lines taken out, and a comma left before a closing bracket
 * dropped. JSON strings cannot hold a line break, so such a line is never inside a string.
 * Text without `//` lines goes out as written.
 */
export function toSendableJson(text: string): string {
    COMMENT_LINE.lastIndex = 0

    if (!COMMENT_LINE.test(text)) {
        return text
    }

    const kept = text.replace(COMMENT_LINE, '')

    return toJson(kept) ?? kept
}
