import { useRightPanelContent } from '@/layouts/Workbench/hooks/useRightPanelContent'
import type { RightPanelContentProps } from '@/layouts/Workbench/types'
import { CommentsPanel } from '@/pages/collaboration'
import { DescriptionEditor } from '@/pages/container'
import { VariablesPanel } from '@/pages/environments'
import { CodeSnippet } from '@/pages/request'

export function RightPanelContent(props: RightPanelContentProps) {
    const { item } = props
    const content = useRightPanelContent(props)

    return (
        <div className="contents">
            {content.kind === 'open' && <p className="muted panel-note">{content.openText}</p>}

            {content.kind === 'docs' && item && (
                <div className="panel-scroll">
                    <DescriptionEditor
                        key={item.id}
                        description={item.description}
                        canEdit={content.canEdit}
                        subject={content.subject}
                        onChange={content.changeDescription}
                    />
                </div>
            )}

            {content.kind === 'comments' && item && <CommentsPanel itemId={item.id} />}

            {content.kind === 'commentsNote' && (
                <p className="muted panel-note">
                    Comments are left on requests. Open a request to read or add them.
                </p>
            )}

            {content.kind === 'code' && content.draftItem?.kind === 'http' && (
                <CodeSnippet item={content.draftItem} />
            )}

            {content.kind === 'variables' && <VariablesPanel item={content.draftItem ?? item} />}

            {content.kind === 'codeNote' && (
                <p className="muted panel-note">Code snippets are made for HTTP requests.</p>
            )}
        </div>
    )
}
