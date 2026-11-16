import { Button, Field, FormError, Input, Logo } from '@/components'
import { useFirstWorkspaceScreen } from '@/pages/workspace/hooks/useFirstWorkspaceScreen'
import { MAX_WORKSPACE_NAME_LENGTH } from '#shared/limits.ts'

export function FirstWorkspaceScreen() {
    const screen = useFirstWorkspaceScreen()

    return (
        <main className="auth">
            <form
                className="auth-card"
                onSubmit={screen.submit}
            >
                <Logo size={36} />
                <h1>Create a workspace</h1>

                <p className="muted">
                    A workspace holds your collections and environments. You can invite others to it
                    later.
                </p>

                <Field label="Workspace name">
                    <Input
                        value={screen.name}
                        maxLength={MAX_WORKSPACE_NAME_LENGTH}
                        autoFocus
                        required
                        onValueChange={screen.setName}
                    />
                </Field>

                {screen.error && <FormError>{screen.error}</FormError>}

                <Button
                    variant="primary"
                    submit
                >
                    Create workspace
                </Button>

                <Button
                    variant="ghost"
                    onClick={screen.leave}
                >
                    Sign out
                </Button>
            </form>
        </main>
    )
}
