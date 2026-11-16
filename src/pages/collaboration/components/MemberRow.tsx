import { UserMinus } from 'lucide-react'

import { Avatar, Button } from '@/components'
import { RoleSelect } from '@/pages/collaboration/components/RoleSelect'
import { MEMBER_ICON_SIZE } from '@/pages/collaboration/logic/config'
import type { MemberRowProps } from '@/pages/collaboration/types'

export function MemberRow({ view, onRole, onRemove }: MemberRowProps) {
    const { member } = view

    return (
        <li>
            <Avatar
                name={member.name}
                color={member.color}
            />

            <div className="grow">
                <div className="truncate">
                    {member.name}
                    {view.isSelf && <span className="muted"> (you)</span>}
                </div>

                <div className="muted truncate">{member.email}</div>
            </div>

            {view.canManage ? (
                <>
                    <RoleSelect
                        label={view.roleSelectLabel}
                        value={member.role as 'editor' | 'viewer'}
                        onChange={(role) => onRole(member, role)}
                    />

                    <Button
                        variant="icon"
                        icon={<UserMinus size={MEMBER_ICON_SIZE} />}
                        aria-label={view.removeLabel}
                        title="Remove from workspace"
                        onClick={() => onRemove(member)}
                    />
                </>
            ) : (
                <span className="muted">{view.roleLabel}</span>
            )}
        </li>
    )
}
