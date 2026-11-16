import type { FormEvent } from 'react'
import { useState } from 'react'

import {
    COPY,
    MIN_PASSWORD_LENGTH,
    PASSWORD_HINT,
    SUBMITTING_LABEL,
} from '@/pages/auth/logic/config'
import type { Mode } from '@/pages/auth/types'
import { signIn, signUp, useDatabase } from '@/stores'

export function useAuthScreen() {
    const database = useDatabase((state) => state.current)
    const databaseError = useDatabase((state) => state.error)

    const [mode, setMode] = useState<Mode>('signIn')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isPicking, setIsPicking] = useState(false)

    const isSignUp = mode === 'signUp'
    const copy = COPY[mode]
    const showPicker = isPicking || Boolean(databaseError)
    const pickerToggleLabel = showPicker ? 'Close' : 'Change'
    const passwordLabel = isSignUp ? `Password${PASSWORD_HINT}` : 'Password'
    const passwordAutoComplete = isSignUp ? 'new-password' : 'current-password'
    const passwordMinLength = isSignUp ? MIN_PASSWORD_LENGTH : undefined
    const submitLabel = isSubmitting ? SUBMITTING_LABEL : copy.submit

    async function submit(event: FormEvent) {
        event.preventDefault()
        setError(null)
        setIsSubmitting(true)

        try {
            if (isSignUp) {
                await signUp(email, name, password)
            } else {
                await signIn(email, password)
            }
        } catch (failure) {
            setError((failure as Error).message)
            setIsSubmitting(false)
        }
    }

    function switchMode() {
        setMode(isSignUp ? 'signIn' : 'signUp')
        setError(null)
    }

    function togglePicker() {
        setIsPicking(!isPicking)
    }

    function closePicker() {
        setIsPicking(false)
    }

    return {
        copy,
        database,
        databaseError,
        isSignUp,
        name,
        email,
        password,
        error,
        isSubmitting,
        showPicker,
        pickerToggleLabel,
        passwordLabel,
        passwordAutoComplete,
        passwordMinLength,
        submitLabel,
        setName,
        setEmail,
        setPassword,
        submit,
        switchMode,
        togglePicker,
        closePicker,
    }
}
