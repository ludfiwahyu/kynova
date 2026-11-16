import { INLINE, LINK_PARTS, SAFE_LINK } from '@/components/ui/Markdown/logic/config'
import type { InlineToken } from '@/components/ui/Markdown/types'

export function tokenize(text: string): InlineToken[] {
    const tokens: InlineToken[] = []
    let end = 0

    for (const match of text.matchAll(INLINE)) {
        if (match.index > end) {
            tokens.push({
                kind: 'text',
                key: end,
                text: text.slice(end, match.index),
            })
        }

        const [token] = match
        const key = match.index

        if (token.startsWith('`')) {
            tokens.push({
                kind: 'code',
                key,
                text: token.slice(1, -1),
            })
        } else if (token.startsWith('**')) {
            tokens.push({
                kind: 'strong',
                key,
                text: token.slice(2, -2),
            })
        } else if (token.startsWith('*')) {
            tokens.push({
                kind: 'em',
                key,
                text: token.slice(1, -1),
            })
        } else {
            const [, label, href] = token.match(LINK_PARTS)!

            // An unsafe link keeps its words and loses the link.
            tokens.push(
                SAFE_LINK.test(href)
                    ? {
                          kind: 'link',
                          key,
                          text: label,
                          href,
                      }
                    : {
                          kind: 'text',
                          key,
                          text: label,
                      },
            )
        }

        end = key + token.length
    }

    if (end < text.length) {
        tokens.push({
            kind: 'text',
            key: end,
            text: text.slice(end),
        })
    }

    return tokens
}
