import { tokenize } from '@/components/ui/Markdown/logic/tokens'
import type { InlineTextProps } from '@/components/ui/Markdown/types'

export function InlineText({ text }: InlineTextProps) {
    return (
        <span className="contents">
            {tokenize(text).map((token) => (
                <span
                    key={token.key}
                    className="contents"
                >
                    {token.kind === 'text' && token.text}

                    {token.kind === 'code' && <code>{token.text}</code>}

                    {token.kind === 'strong' && (
                        <strong>
                            <InlineText text={token.text} />
                        </strong>
                    )}

                    {token.kind === 'em' && (
                        <em>
                            <InlineText text={token.text} />
                        </em>
                    )}

                    {token.kind === 'link' && (
                        <a
                            href={token.href}
                            target="_blank"
                            rel="noreferrer noopener"
                        >
                            {token.text}
                        </a>
                    )}
                </span>
            ))}
        </span>
    )
}
