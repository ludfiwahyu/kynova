import { Button } from '@/components'
import { toIssueRows } from '@/layouts/Workbench/logic/mappers'
import type { IssuesViewProps } from '@/layouts/Workbench/types'
import { openTab } from '@/stores'

export function IssuesView({ issues }: IssuesViewProps) {
    const rows = toIssueRows(issues)

    return (
        <div className="bottom-scroll">
            {rows.length === 0 && (
                <p className="issues-clear">
                    No issues in this workspace’s requests, collections or environments.
                </p>
            )}

            {rows.length > 0 && (
                <ul
                    className="issue-list"
                    aria-label="Issues"
                >
                    {rows.map((row) => (
                        <li key={row.key}>
                            <Button
                                variant="plain"
                                className="issue-row"
                                data-severity={row.issue.severity}
                                icon={row.icon}
                                onClick={() => openTab(row.issue.target)}
                            >
                                <span className="issue-message">{row.issue.message}</span>
                                <span className="issue-where truncate">{row.issue.where}</span>
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
