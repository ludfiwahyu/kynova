import { PanelLeft, Star, X } from 'lucide-react'

import { Button } from '@/components'
import { REPO_URL } from '@/constants'
import { useStatusBar } from '@/layouts/Workbench/hooks/useStatusBar'
import { DISMISS_ICON_SIZE, STATUS_ICON_SIZE } from '@/layouts/Workbench/logic/config'

export function StatusBar() {
    const bar = useStatusBar()

    return (
        <footer className="statusbar">
            <Button
                variant="plain"
                className="statusbar-button"
                aria-label={bar.sidebarLabel}
                aria-pressed={bar.sidebarOpen}
                title={bar.sidebarLabel}
                icon={<PanelLeft size={STATUS_ICON_SIZE} />}
                onClick={bar.toggleSidebar}
            />

            <Button
                variant="statusbarText"
                aria-pressed={bar.consoleOpen}
                onClick={bar.toggleConsole}
            >
                Console
            </Button>

            <Button
                variant="statusbarText"
                aria-pressed={bar.issuesOpen}
                onClick={bar.toggleIssues}
            >
                Issues
                {bar.issueCount > 0 && <span className="statusbar-count">{bar.issueCount}</span>}
            </Button>

            <span
                className="connection"
                data-state={bar.connection}
                role="status"
            >
                {bar.connectionLabel}
            </span>

            {bar.notice && (
                <span
                    className="notice"
                    role="alert"
                >
                    {bar.notice}

                    <Button
                        variant="icon"
                        icon={<X size={DISMISS_ICON_SIZE} />}
                        aria-label="Dismiss"
                        onClick={bar.dismissNotice}
                    />
                </span>
            )}

            <span className="grow" />

            <a
                className="statusbar-text statusbar-link"
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                title="Open the Kynova repository on GitHub to star it or review the code"
            >
                <Star size={STATUS_ICON_SIZE} />
                Star on GitHub
            </a>
        </footer>
    )
}
