import { Trash2 } from 'lucide-react'

import { Avatar, Button, TextArea } from '@/components'
import { useCommentsPanel } from '@/pages/collaboration/hooks/useCommentsPanel'
import { COMMENT_ICON_SIZE, MAX_COMMENT_LENGTH } from '@/pages/collaboration/logic/config'
import type { CommentsPanelProps } from '@/pages/collaboration/types'

export function CommentsPanel({ itemId }: CommentsPanelProps) {
    const panel = useCommentsPanel(itemId)

    return (
        <div className="side-panel-body comments">
            {panel.comments.length === 0 ? (
                <p className="muted">
                    No comments yet. Ask a question or leave a note about this request for your
                    team.
                </p>
            ) : (
                <ol className="comment-list">
                    {panel.comments.map((comment) => (
                        <li key={comment.id}>
                            <Avatar
                                name={comment.authorName}
                                color={comment.color}
                            />

                            <div className="grow">
                                <div className="comment-meta">
                                    <strong>{comment.authorName}</strong>
                                    <time className="muted">{comment.time}</time>

                                    {comment.canDelete && (
                                        <Button
                                            variant="icon"
                                            icon={<Trash2 size={COMMENT_ICON_SIZE} />}
                                            aria-label="Delete comment"
                                            onClick={() => panel.remove(comment.id)}
                                        />
                                    )}
                                </div>

                                <p className="comment-text">{comment.text}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            )}

            <div className="comment-composer">
                <TextArea
                    aria-label="New comment"
                    rows={3}
                    maxLength={MAX_COMMENT_LENGTH}
                    placeholder="Write a comment"
                    value={panel.draft}
                    disabled={!panel.isOnline}
                    onValueChange={panel.setDraft}
                    onKeyDown={panel.handleKeyDown}
                />

                <Button
                    variant="primary"
                    disabled={!panel.canPost}
                    onClick={panel.post}
                >
                    Comment
                </Button>
            </div>
        </div>
    )
}
