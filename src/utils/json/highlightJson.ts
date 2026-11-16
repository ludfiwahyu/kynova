export interface JsonToken {
    text: string
    kind: 'key' | 'string' | 'number' | 'literal' | 'variable' | 'plain' | 'comment'
}

// A string (optionally followed by a colon, making it a key), a literal, or a number.
const TOKEN = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g

function kindOfValue(string: string | undefined, literal: string | undefined): JsonToken['kind'] {
    if (string) {
        return 'string'
    }

    return literal ? 'literal' : 'number'
}

/** Splits JSON text into coloured tokens. Text that is not JSON simply comes back mostly plain. */
export function highlightJson(text: string): JsonToken[] {
    const tokens: JsonToken[] = []
    let end = 0

    for (const match of text.matchAll(TOKEN)) {
        if (match.index > end) {
            tokens.push({
                text: text.slice(end, match.index),
                kind: 'plain',
            })
        }

        const [whole, string, colon, literal] = match

        if (string && colon) {
            tokens.push(
                {
                    text: string,
                    kind: 'key',
                },
                {
                    text: colon,
                    kind: 'plain',
                },
            )
        } else {
            tokens.push({
                text: whole,
                kind: kindOfValue(string, literal),
            })
        }

        end = match.index + whole.length
    }

    if (end < text.length) {
        tokens.push({
            text: text.slice(end),
            kind: 'plain',
        })
    }

    return tokens
}

/** The colour class of a token: `true` and `false` are told apart from `null`, so each type of value has its own colour. */
export function tokenKind(token: JsonToken): string {
    if (token.kind !== 'literal') {
        return token.kind
    }

    return token.text === 'null' ? 'null' : 'boolean'
}
