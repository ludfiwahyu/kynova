import { InlineText } from '@/components/ui/Markdown/components/InlineText'
import { blockTag } from '@/components/ui/Markdown/logic/blocks'
import type { MarkdownBlockProps } from '@/components/ui/Markdown/types'

export function MarkdownBlock({ block }: MarkdownBlockProps) {
    const Tag = blockTag(block)

    return (
        <Tag>
            {block.kind === 'code' && <code>{block.text}</code>}

            {block.kind === 'list' &&
                block.items.map((item, index) => (
                    <li key={index}>
                        <InlineText text={item} />
                    </li>
                ))}

            {(block.kind === 'heading' || block.kind === 'paragraph') && (
                <InlineText text={block.text} />
            )}
        </Tag>
    )
}
