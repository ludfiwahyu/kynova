import { Avatar, Button } from '@/components'
import { MembersDialog } from '@/pages/collaboration'
import { useWorkspaceOverview } from '@/pages/workspace/hooks/useWorkspaceOverview'
import type { WorkspaceSectionProps } from '@/pages/workspace/types'

export function WorkspaceOverview(props: WorkspaceSectionProps) {
    const overview = useWorkspaceOverview(props)

    return (
        <div className="settings-page">
            <section className="settings-section">
                <h3>In this workspace</h3>
                <p className="muted">{overview.countsLabel}</p>
            </section>

            <section className="settings-section">
                <div className="settings-row">
                    <h3>People</h3>

                    <Button onClick={overview.openPeople}>{overview.manageLabel}</Button>
                </div>

                <ul className="people-list">
                    {overview.lines.map((line) => (
                        <li key={line.id}>
                            <Avatar
                                name={line.name}
                                color={line.color}
                            />

                            <span className="grow truncate">{line.name}</span>
                            <span className="muted">{line.roleLabel}</span>
                        </li>
                    ))}
                </ul>
            </section>

            {overview.isManaging && <MembersDialog onClose={overview.closePeople} />}
        </div>
    )
}
