import { MarkdownBlock } from '@/components/ui/Markdown/components/MarkdownBlock'
import { parseBlocks } from '@/components/ui/Markdown/logic/blocks'
import type { MarkdownProps } from '@/components/ui/Markdown/types'

export function Markdown({ source }: MarkdownProps) {
    return (
        <div className="markdown">
            {parseBlocks(source).map((block, index) => (
                <MarkdownBlock
                    key={index}
                    block={block}
                />
            ))}
        </div>
    )
}
