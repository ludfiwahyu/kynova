import { FORMER_MEMBER_COLOR, MAX_SHOWN, ROLE_LABEL } from '@/pages/collaboration/logic/config'
import { presenceLabel } from '@/pages/collaboration/logic/helpers'
import type {
    CommentView,
    CommentViewOptions,
    MemberView,
    MemberViewOptions,
    PresenceView,
} from '@/pages/collaboration/types'
import { formatDay, formatTime } from '@/utils'
import type { Comment, Member, Presence } from '#shared/types.ts'

export function toPresenceView(
    presence: Presence[],
    selfId: string | undefined,
    itemId?: string,
): PresenceView {
    // One person can be connected from several browser tabs; show them once.
    const everyone = [...new Map(presence.map((person) => [person.userId, person])).values()]

    const others = everyone.filter((person) => {
        if (person.userId === selfId) {
            return false
        }

        return (
            itemId === undefined ||
            presence.some((entry) => entry.userId === person.userId && entry.itemId === itemId)
        )
    })

    return {
        people: others.slice(0, MAX_SHOWN),
        extra: Math.max(others.length - MAX_SHOWN, 0),
        label: presenceLabel(others.length, itemId),
    }
}

export function toCommentViews(
    comments: Comment[],
    members: Member[],
    { selfId, role }: CommentViewOptions,
): CommentView[] {
    return comments.map((comment) => {
        const author = members.find((member) => member.userId === comment.userId)

        return {
            id: comment.id,
            authorName: comment.authorName,
            color: author?.color ?? FORMER_MEMBER_COLOR,
            time: `${formatDay(comment.createdAt)}, ${formatTime(comment.createdAt)}`,
            text: comment.text,
            canDelete: comment.userId === selfId || role === 'owner',
        }
    })
}

export function toMemberViews(
    members: Member[],
    { selfId, isOwner }: MemberViewOptions,
): MemberView[] {
    return members.map((member) => ({
        member,
        roleLabel: ROLE_LABEL[member.role],
        isSelf: member.userId === selfId,
        canManage: isOwner && member.role !== 'owner',
        roleSelectLabel: `Role of ${member.name}`,
        removeLabel: `Remove ${member.name}`,
    }))
}
