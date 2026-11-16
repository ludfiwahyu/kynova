import { Link2 } from 'lucide-react'

import { Button, CopyButton, FormError, Input } from '@/components'
import { RoleSelect } from '@/pages/collaboration/components/RoleSelect'
import { useInviteLink } from '@/pages/collaboration/hooks/useInviteLink'
import { MEMBER_ICON_SIZE } from '@/pages/collaboration/logic/config'
import type { InviteLinkProps } from '@/pages/collaboration/types'

export function InviteLink({ workspaceId }: InviteLinkProps) {
    const invite = useInviteLink(workspaceId)

    return (
        <section className="invite">
            <h3>Invite with a link</h3>

            <div className="row">
                <span className="muted">People who join become</span>

                <RoleSelect
                    label="Role for invited people"
                    value={invite.role}
                    onChange={invite.changeRole}
                />

                <span className="grow" />

                <Button
                    variant="primary"
                    icon={<Link2 size={MEMBER_ICON_SIZE} />}
                    onClick={invite.create}
                >
                    Create link
                </Button>
            </div>

            {invite.link && (
                <>
                    <div className="row">
                        <Input
                            variant="code"
                            aria-label="Invite link"
                            value={invite.link}
                            readOnly
                            onFocus={(event) => event.target.select()}
                        />

                        <CopyButton
                            text={invite.link}
                            label="Copy link"
                        />
                    </div>

                    <p className="muted">
                        Anyone with a Kynova account and this link can join. It expires in 7 days.
                    </p>
                </>
            )}

            {invite.error && <FormError>{invite.error}</FormError>}
        </section>
    )
}
