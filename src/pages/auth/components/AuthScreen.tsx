import { Database } from 'lucide-react'

import { Button, Field, FormError, Input, Logo } from '@/components'
import { useAuthScreen } from '@/pages/auth/hooks/useAuthScreen'
import { DATABASE_ICON_SIZE, MAX_USER_NAME_LENGTH } from '@/pages/auth/logic/config'
import type { AuthScreenProps } from '@/pages/auth/types'
import { DatabasePicker } from '@/pages/database'

export function AuthScreen({ hasInvite }: AuthScreenProps) {
    const screen = useAuthScreen()

    return (
        <main className="auth">
            <div className="auth-card">
                <Logo size={36} />
                <h1>{screen.copy.title}</h1>

                {hasInvite && (
                    <p className="muted">You were invited to a workspace. Sign in to join it.</p>
                )}

                {screen.database && (
                    <div className="auth-database">
                        <Database size={DATABASE_ICON_SIZE} />

                        <span className="truncate">
                            {screen.database.label} · {screen.database.detail}
                        </span>

                        <Button
                            variant="link"
                            aria-expanded={screen.showPicker}
                            onClick={screen.togglePicker}
                        >
                            {screen.pickerToggleLabel}
                        </Button>
                    </div>
                )}

                {screen.databaseError && <FormError>{screen.databaseError}</FormError>}
                {screen.showPicker && <DatabasePicker onSwitched={screen.closePicker} />}

                <form
                    className="auth-form"
                    onSubmit={screen.submit}
                >
                    {screen.isSignUp && (
                        <Field label="Name">
                            <Input
                                value={screen.name}
                                autoComplete="name"
                                maxLength={MAX_USER_NAME_LENGTH}
                                required
                                onValueChange={screen.setName}
                            />
                        </Field>
                    )}

                    <Field label="Email">
                        <Input
                            type="email"
                            value={screen.email}
                            autoComplete="email"
                            required
                            onValueChange={screen.setEmail}
                        />
                    </Field>

                    <Field label={screen.passwordLabel}>
                        <Input
                            type="password"
                            value={screen.password}
                            autoComplete={screen.passwordAutoComplete}
                            minLength={screen.passwordMinLength}
                            required
                            onValueChange={screen.setPassword}
                        />
                    </Field>

                    {screen.error && <FormError>{screen.error}</FormError>}

                    <Button
                        variant="primary"
                        submit
                        disabled={screen.isSubmitting}
                    >
                        {screen.submitLabel}
                    </Button>

                    <p className="auth-switch muted">
                        {screen.copy.switchPrompt}{' '}
                        <Button
                            variant="plain"
                            onClick={screen.switchMode}
                        >
                            {screen.copy.switchAction}
                        </Button>
                    </p>
                </form>
            </div>
        </main>
    )
}
