import { Dialog, FormError } from '@/components'
import { InviteLink } from '@/pages/collaboration/components/InviteLink'
import { MemberRow } from '@/pages/collaboration/components/MemberRow'
import { useMembersDialog } from '@/pages/collaboration/hooks/useMembersDialog'
import type { MembersDialogProps } from '@/pages/collaboration/types'

export function MembersDialog({ onClose }: MembersDialogProps) {
    const dialog = useMembersDialog()

    if (!dialog.workspace) {
        return null
    }

    return (
        <Dialog
            title={dialog.title}
            onClose={onClose}
        >
            {dialog.isOwner ? (
                <InviteLink workspaceId={dialog.workspace.id} />
            ) : (
                <p className="muted">Only the workspace owner can invite people or change roles.</p>
            )}

            <section>
                <h3 className="members-heading">{dialog.countLabel}</h3>

                <ul className="member-list">
                    {dialog.memberViews.map((view) => (
                        <MemberRow
                            key={view.member.userId}
                            view={view}
                            onRole={dialog.setRole}
                            onRemove={dialog.removeMember}
                        />
                    ))}
                </ul>
            </section>

            {dialog.error && <FormError>{dialog.error}</FormError>}
        </Dialog>
    )
}
