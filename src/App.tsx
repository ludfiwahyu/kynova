import { useEffect, useState } from 'react'

import { Button, ConfirmHost, EmptyState, WindowButtons } from '@/components'
import { usePrefersDark } from '@/hooks'
import { Workbench } from '@/layouts'
import { AuthScreen } from '@/pages/auth'
import { InviteScreen } from '@/pages/collaboration'
import { FirstWorkspaceScreen } from '@/pages/workspace'
import { ApiError } from '@/services'
import {
    applyAccent,
    applyTheme,
    chosenTheme,
    CODE_FONTS,
    UI_FONTS,
    usePreferences,
} from '@/settings'
import {
    loadDatabase,
    loadSession,
    selectWorkspace,
    setPendingLink,
    useDatabase,
    useSession,
    useWorkspaceSettings,
} from '@/stores'
import { clearInviteFromLocation, inviteTokenFromLocation, itemLinkFromLocation } from '@/utils'

/**
 * Applies the look: the workspace's own light or dark and accent colour when
 * its owner set them, otherwise this person's theme from Settings; the fonts,
 * the editor font size, and the shape (corners, size, icon weight).
 */
function useAppearance(): void {
    const preferences = usePreferences()
    const prefersDark = usePrefersDark()
    const workspace = useWorkspaceSettings()
    const theme = workspace.theme ?? chosenTheme(preferences, prefersDark)

    useEffect(() => applyTheme(theme), [theme])
    useEffect(() => applyAccent(workspace.accentColor), [workspace.accentColor])
    useEffect(() => {
        document.documentElement.style.setProperty(
            '--code-font-size',
            `${preferences.editorFontSize}px`,
        )
    }, [preferences.editorFontSize])
    useEffect(() => {
        const root = document.documentElement.style

        root.setProperty('--font-ui', UI_FONTS[preferences.uiFont]?.stack ?? UI_FONTS.system.stack)
        root.setProperty(
            '--font-code',
            CODE_FONTS[preferences.codeFont]?.stack ?? CODE_FONTS.system.stack,
        )
    }, [preferences.uiFont, preferences.codeFont])
    useEffect(() => {
        const root = document.documentElement.dataset

        root.corners = preferences.cornerStyle
        root.size = preferences.controlSize
        root.icons = preferences.iconWeight
    }, [preferences.cornerStyle, preferences.controlSize, preferences.iconWeight])
    useEffect(() => {
        document.documentElement.style.setProperty('--indent-size', String(preferences.indentSize))
    }, [preferences.indentSize])
}

function Screen() {
    const status = useSession((state) => state.status)
    const workspaceId = useSession((state) => state.activeWorkspaceId)
    const [inviteToken, setInviteToken] = useState(inviteTokenFromLocation)
    const [loadError, setLoadError] = useState<string | null>(null)

    useEffect(() => {
        loadDatabase()
            .then(loadSession)
            .catch((error: Error) => {
                // The picked database is unreachable: sign-in shows why, and offers another.
                if (error instanceof ApiError && error.status === 503) {
                    useDatabase.setState({ error: error.message })
                    useSession.setState({ status: 'signedOut' })
                } else {
                    setLoadError(error.message)
                }
            })
    }, [])

    // A shared link picks its workspace, and the workbench opens its tab once the workspace loads.
    useEffect(() => {
        if (status !== 'signedIn') {
            return
        }

        const link = itemLinkFromLocation()

        if (!link) {
            return
        }

        clearInviteFromLocation()

        if (
            useSession.getState().workspaces.some((workspace) => workspace.id === link.workspaceId)
        ) {
            selectWorkspace(link.workspaceId)
            setPendingLink({
                tab: {
                    kind: link.kind,
                    id: link.id,
                },
            })
        } else {
            setPendingLink({
                notice: 'That link is for a workspace you are not in. Ask its owner for an invite.',
            })
        }
    }, [status])

    if (loadError) {
        return (
            <EmptyState
                title="Kynova could not start"
                action={
                    <Button
                        variant="default"
                        onClick={() => location.reload()}
                    >
                        Try again
                    </Button>
                }
            >
                {loadError}
            </EmptyState>
        )
    }

    if (status === 'loading') {
        return null
    }

    if (status === 'signedOut') {
        return <AuthScreen hasInvite={inviteToken !== null} />
    }

    if (inviteToken) {
        return (
            <InviteScreen
                token={inviteToken}
                onDone={() => setInviteToken(null)}
            />
        )
    }

    if (!workspaceId) {
        return <FirstWorkspaceScreen />
    }

    // Keyed, so switching workspace starts from a clean workbench.
    return (
        <Workbench
            key={workspaceId}
            workspaceId={workspaceId}
        />
    )
}

export function App() {
    useAppearance()

    return (
        <div className="contents">
            <Screen />
            <ConfirmHost />
            <WindowButtons />
        </div>
    )
}
