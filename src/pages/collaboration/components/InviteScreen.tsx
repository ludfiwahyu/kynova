import { Button, Logo } from '@/components'
import { useInviteScreen } from '@/pages/collaboration/hooks/useInviteScreen'
import type { InviteScreenProps } from '@/pages/collaboration/types'

export function InviteScreen({ token, onDone }: InviteScreenProps) {
    const screen = useInviteScreen({
        token,
        onDone,
    })

    return (
        <main className="auth">
            <div className="auth-card">
                <Logo size={36} />

                {screen.error && (
                    <>
                        <h1>This invite cannot be used</h1>
                        <p className="muted">
                            {screen.error} Ask the workspace owner for a new link.
                        </p>
                        <Button onClick={screen.finish}>Continue to Kynova</Button>
                    </>
                )}

                {screen.showInvite && (
                    <>
                        <h1>Join {screen.invite?.workspaceName}</h1>
                        <p className="muted">
                            You are invited as {screen.roleArticle}. {screen.roleSummary}
                        </p>
                        <Button
                            variant="primary"
                            disabled={screen.isJoining}
                            onClick={screen.join}
                        >
                            {screen.joinLabel}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={screen.finish}
                        >
                            Not now
                        </Button>
                    </>
                )}
            </div>
        </main>
    )
}
