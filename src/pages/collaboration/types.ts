import type { AssignableRole, Member, Presence, Role } from '#shared/types.ts'

// ===================================================================
//
//   Props
//
// ===================================================================

export interface PresenceStackProps {
    itemId?: string
}

export interface InviteScreenProps {
    token: string
    onDone: () => void
}

export interface CommentsPanelProps {
    itemId: string
}

export interface MembersDialogProps {
    onClose: () => void
}

export interface RoleSelectProps {
    value: AssignableRole
    label: string
    onChange: (role: AssignableRole) => void
}

export interface InviteLinkProps {
    workspaceId: string
}

export interface MemberRowProps {
    view: MemberView
    onRole: (member: Member, role: AssignableRole) => void
    onRemove: (member: Member) => void
}

// ===================================================================
//
//   View models
//
// ===================================================================

export interface PresenceView {
    people: Presence[]
    extra: number
    label: string
}

export interface CommentView {
    id: string
    authorName: string
    color: string
    time: string
    text: string
    canDelete: boolean
}

export interface MemberView {
    member: Member
    roleLabel: string
    isSelf: boolean
    canManage: boolean
    roleSelectLabel: string
    removeLabel: string
}

export interface MemberViewOptions {
    selfId?: string
    isOwner: boolean
}

export interface CommentViewOptions {
    selfId?: string
    role: Role | null
}
