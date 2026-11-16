import {
    HEADING_LINE,
    HEADING_OFFSET,
    LIST_ITEM,
    MAX_HEADING,
    NOT_PARAGRAPH,
} from '@/components/ui/Markdown/logic/config'
import type { Block } from '@/components/ui/Markdown/types'

export function parseBlocks(source: string): Block[] {
    const blocks: Block[] = []
    const lines = source.replace(/\r\n/g, '\n').split('\n')

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        if (!line.trim()) {
            continue
        }

        if (line.startsWith('```')) {
            const code: string[] = []

            while (++i < lines.length && !lines[i].startsWith('```')) {
                code.push(lines[i])
            }

            blocks.push({
                kind: 'code',
                text: code.join('\n'),
            })

            continue
        }

        const heading = line.match(HEADING_LINE)

        if (heading) {
            blocks.push({
                kind: 'heading',
                level: heading[1].length,
                text: heading[2],
            })

            continue
        }

        if (LIST_ITEM.test(line)) {
            const ordered = Boolean(line.match(LIST_ITEM)![2])
            const items: string[] = []

            // Indented lines continue the item above them.
            while (
                i < lines.length &&
                lines[i].trim() &&
                (LIST_ITEM.test(lines[i]) || /^\s+/.test(lines[i]))
            ) {
                const match = lines[i].match(LIST_ITEM)

                if (match) {
                    items.push(match[3])
                } else {
                    items[items.length - 1] += ` ${lines[i].trim()}`
                }

                i++
            }

            i--

            blocks.push({
                kind: 'list',
                ordered,
                items,
            })

            continue
        }

        const paragraph = [line]

        while (i + 1 < lines.length && lines[i + 1].trim() && !NOT_PARAGRAPH.test(lines[i + 1])) {
            paragraph.push(lines[++i])
        }

        blocks.push({
            kind: 'paragraph',
            text: paragraph.join(' '),
        })
    }

    return blocks
}

export function blockTag(block: Block): 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'pre' | 'ol' | 'ul' {
    switch (block.kind) {
        case 'heading':
            return `h${Math.min(block.level + HEADING_OFFSET, MAX_HEADING)}` as 'h3'
        case 'paragraph':
            return 'p'
        case 'code':
            return 'pre'
        case 'list':
            return block.ordered ? 'ol' : 'ul'
    }
}
