import type { FormEvent, KeyboardEvent } from 'react'
import { useRef, useState } from 'react'

import type { Anchor } from '@/components'
import { MIN_POPOVER_WIDTH } from '@/pages/request/logic/config'
import { toMethodOptions } from '@/pages/request/logic/mappers'
import type { MethodSelectProps } from '@/pages/request/types'
import { parseMethod, STANDARD_METHODS } from '#shared/methods.ts'
import type { HttpMethod } from '#shared/types.ts'

export function useMethodSelect({ value, onChange, disabled }: MethodSelectProps) {
    const [anchor, setAnchor] = useState<Anchor | null>(null)
    const [draft, setDraft] = useState('')
    const [error, setError] = useState<string | null>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)

    const isCustom = !(STANDARD_METHODS as readonly string[]).includes(value)
    const methods = isCustom ? [...STANDARD_METHODS, value] : STANDARD_METHODS
    const options = toMethodOptions(methods, value)

    const isOpen = anchor !== null
    const valueClass = `select-value method-text truncate method-${value}`
    const minWidth = anchor ? Math.max(anchor.right - anchor.left, MIN_POPOVER_WIDTH) : 0

    function open() {
        if (disabled) {
            return
        }

        setDraft('')
        setError(null)
        setAnchor(buttonRef.current!.getBoundingClientRect())
    }

    function close() {
        setAnchor(null)

        // Back to the field, unless a click elsewhere already moved the focus on.
        const active = document.activeElement

        if (!active || active === document.body || active.closest('.menu')) {
            buttonRef.current?.focus()
        }
    }

    function toggle() {
        if (anchor) {
            close()

            return
        }

        open()
    }

    function choose(method: HttpMethod) {
        if (method !== value) {
            onChange(method)
        }

        close()
    }

    function pick(method: HttpMethod) {
        if (method !== value) {
            onChange(method)
        }
    }

    function submitCustom(event: FormEvent) {
        event.preventDefault()

        const result = parseMethod(draft)

        if ('error' in result) {
            setError(result.error)

            return
        }

        choose(result.method)
    }

    function changeDraft(text: string) {
        setDraft(text.toUpperCase())
        setError(null)
    }

    function handleButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            open()
        }
    }

    function handleDraftKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.stopPropagation()
        }
    }

    return {
        anchor,
        draft,
        error,
        buttonRef,
        options,
        isOpen,
        valueClass,
        minWidth,
        close,
        toggle,
        pick,
        submitCustom,
        changeDraft,
        handleButtonKeyDown,
        handleDraftKeyDown,
    }
}
