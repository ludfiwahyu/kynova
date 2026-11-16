import type { KeyboardEvent } from 'react'
import { useState } from 'react'

import { toCommentViews } from '@/pages/collaboration/logic/mappers'
import { matchesShortcut } from '@/settings'
import { addComment, deleteComment, useSession, useWorkspace } from '@/stores'

export function useCommentsPanel(itemId: string) {
    const selfId = useSession((state) => state.user?.id)
    const role = useWorkspace((state) => state.role)
    const members = useWorkspace((state) => state.members)
    const allComments = useWorkspace((state) => state.comments)
    const isOnline = useWorkspace((state) => state.connection === 'connected')

    const [draft, setDraft] = useState('')

    const ofItem = Object.values(allComments)
        .filter((comment) => comment.itemId === itemId)
        .sort((a, b) => a.createdAt - b.createdAt)

    const comments = toCommentViews(ofItem, members, {
        selfId,
        role,
    })

    const canPost = draft.trim() !== '' && isOnline

    function post() {
        if (!canPost) {
            return
        }

        addComment(itemId, draft)
        setDraft('')
    }

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (matchesShortcut(event, 'request.postComment')) {
            post()
        }
    }

    return {
        comments,
        draft,
        isOnline,
        canPost,
        setDraft,
        post,
        handleKeyDown,
        remove: deleteComment,
    }
}
