type Token =
    | { kind: 'open';
name: string;
text: string;
selfClosing: boolean }
    | { kind: 'close';
name: string;
text: string }
    | { kind: 'other';
text: string }
    | { kind: 'textNode';
text: string }

/** HTML elements that never have a closing tag. */
const VOID_ELEMENTS = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'source',
    'track',
    'wbr',
])

/** HTML elements that sit inside a line of text, so an element holding only these stays on one line. */
const INLINE_ELEMENTS = new Set([
    'a',
    'abbr',
    'b',
    'bdi',
    'bdo',
    'br',
    'cite',
    'code',
    'data',
    'dfn',
    'em',
    'i',
    'img',
    'input',
    'kbd',
    'label',
    'mark',
    'q',
    's',
    'samp',
    'small',
    'span',
    'strong',
    'sub',
    'sup',
    'time',
    'u',
    'var',
    'wbr',
])

/** HTML elements whose content is kept as it is: code is re-indented, preformatted text untouched. */
const CODE_ELEMENTS = new Set(['script', 'style'])
const PREFORMATTED_ELEMENTS = new Set(['pre', 'textarea'])

/** The end of a tag starting at `start`, skipping `>` inside quoted attribute values. */
function tagEnd(text: string, start: number): number {
    let quote = ''

    for (let index = start + 1; index < text.length; index++) {
        const char = text[index]

        if (quote) {
            if (char === quote) {
                quote = ''
            }
        } else if (char === '"' || char === "'") {
            quote = char
        } else if (char === '>') {
            return index + 1
        }
    }

    return text.length
}

function blockEnd(text: string, start: number, closing: string): number {
    const found = text.indexOf(closing, start)

    return found === -1 ? text.length : found + closing.length
}

function tokenize(text: string, isHtml: boolean): Token[] {
    const tokens: Token[] = []
    let index = 0

    while (index < text.length) {
        if (!/^<[a-zA-Z!?/]/.test(text.slice(index, index + 2))) {
            const next = text.indexOf('<', index + 1)
            const end = next === -1 ? text.length : next

            tokens.push({
                kind: 'textNode',
                text: text.slice(index, end),
            })
            index = end
            continue
        }

        let end: number

        if (text.startsWith('<!--', index)) {
            end = blockEnd(text, index, '-->')
        } else if (text.startsWith('<![CDATA[', index)) {
            end = blockEnd(text, index, ']]>')
        } else {
            end = tagEnd(text, index)
        }

        const tag = text.slice(index, end)
        const name = /^<\/?([a-zA-Z][^\s/>]*)/.exec(tag)?.[1]?.toLowerCase()

        if (!name || tag.startsWith('<!') || tag.startsWith('<?')) {
            tokens.push({
                kind: 'other',
                text: tag,
            })
        } else if (tag.startsWith('</')) {
            tokens.push({
                kind: 'close',
                name,
                text: tag,
            })
        } else {
            const selfClosing = tag.endsWith('/>') || (isHtml && VOID_ELEMENTS.has(name))

            tokens.push({
                kind: 'open',
                name,
                text: tag,
                selfClosing,
            })

            // Script, style and preformatted content is not markup: it runs up to its closing tag.
            if (
                isHtml &&
                !selfClosing &&
                (CODE_ELEMENTS.has(name) || PREFORMATTED_ELEMENTS.has(name))
            ) {
                const closeAt = text.toLowerCase().indexOf(`</${name}`, end)
                const contentEnd = closeAt === -1 ? text.length : closeAt

                tokens.push({
                    kind: 'textNode',
                    text: text.slice(end, contentEnd),
                })
                end = contentEnd
            }
        }

        index = end
    }

    return tokens
}

/** HTML collapses runs of white space in text; XML keeps the text but not its outer spaces. */
function cleanText(text: string, isHtml: boolean): string {
    return isHtml ? text.replace(/\s+/g, ' ').trim() : text.trim()
}

/**
 * The index of the tag closing the element opened at `start`, when everything inside is text
 * (or, in HTML, inline elements); -1 when it holds other elements.
 */
function inlineEnd(tokens: Token[], start: number, isHtml: boolean): number {
    const open = tokens[start]
    let nesting = 0

    for (let index = start + 1; index < tokens.length; index++) {
        const token = tokens[index]

        if (token.kind === 'textNode') {
            continue
        }

        if (token.kind === 'close') {
            if (nesting === 0) {
                return open.kind === 'open' && token.name === open.name ? index : -1
            }

            nesting--
            continue
        }

        if (token.kind === 'open' && isHtml && INLINE_ELEMENTS.has(token.name)) {
            nesting += token.selfClosing ? 0 : 1
            continue
        }

        return -1
    }

    return -1
}

/** The lines of a block of code, without the indent they share and without blank ends. */
function dedent(text: string): string[] {
    const lines = text.replace(/\r\n?/g, '\n').split('\n')

    while (lines.length > 0 && !lines[0].trim()) {
        lines.shift()
    }

    while (lines.length > 0 && !lines[lines.length - 1].trim()) {
        lines.pop()
    }

    const shared = lines
        .filter((line) => line.trim())
        .reduce((least, line) => Math.min(least, /^\s*/.exec(line)![0].length), Infinity)

    return lines.map((line) => line.slice(shared).trimEnd())
}

/**
 * Lays out HTML or XML one tag per line, indented by nesting, as an editor's formatter does.
 * An element holding only text (and inline elements in HTML) stays on one line; script and style are re-indented, `pre` and
 * `textarea` kept as they are. Returns null for text with no tags.
 */
export function formatMarkup(text: string, indent: string, isHtml: boolean): string | null {
    if (!/<[a-zA-Z!?/]/.test(text)) {
        return null
    }

    const tokens = tokenize(text, isHtml)
    const lines: string[] = []
    let depth = 0

    const push = (line: string) => lines.push(indent.repeat(depth) + line)

    for (let index = 0; index < tokens.length; index++) {
        const token = tokens[index]

        if (token.kind === 'textNode') {
            const trimmed = cleanText(token.text, isHtml)

            if (trimmed) {
                for (const line of trimmed.split(/\r?\n/)) {
                    push(line.trim())
                }
            }

            continue
        }

        if (token.kind === 'other') {
            push(token.text)
            continue
        }

        if (token.kind === 'close') {
            depth = Math.max(0, depth - 1)
            push(token.text)
            continue
        }

        if (token.selfClosing) {
            push(token.text)
            continue
        }

        const content = tokens[index + 1]
        const close = content?.kind === 'textNode' ? tokens[index + 2] : content
        const closesHere = close?.kind === 'close' && close.name === token.name

        if (isHtml && PREFORMATTED_ELEMENTS.has(token.name)) {
            const inner = content?.kind === 'textNode' ? content.text : ''

            push(token.text + inner + (closesHere ? close.text : ''))
            index += (content?.kind === 'textNode' ? 1 : 0) + (closesHere ? 1 : 0)
            continue
        }

        if (isHtml && CODE_ELEMENTS.has(token.name) && content?.kind === 'textNode') {
            const code = dedent(content.text)

            if (code.length > 1 || (code.length === 1 && !closesHere)) {
                push(token.text)
                depth++

                for (const line of code) {
                    lines.push(line ? indent.repeat(depth) + line : '')
                }

                index += 1
                continue
            }
        }

        // Text alone inside an element (with inline elements in HTML), or nothing: `<p>Hi <b>you</b></p>` on one line.
        const end = inlineEnd(tokens, index, isHtml)

        if (end !== -1) {
            const inner = cleanText(
                tokens
                    .slice(index + 1, end)
                    .map((part) => part.text)
                    .join(''),
                isHtml,
            )

            if (!inner.includes('\n')) {
                push(token.text + inner + tokens[end].text)
                index = end
                continue
            }
        }

        push(token.text)
        depth++
    }

    return lines.join('\n')
}
