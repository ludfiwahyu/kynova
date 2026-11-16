import type { KeyboardEvent } from 'react'
import { useId, useRef, useState } from 'react'

import type { Anchor } from '@/components/ui/Menu/types'
import { PLACEHOLDER } from '@/components/ui/Select/logic/config'
import { toOptionViews } from '@/components/ui/Select/logic/mappers'
import type { SelectOption, SelectProps } from '@/components/ui/Select/types'

export function useSelect<T extends string>({
    value,
    options,
    onChange,
    disabled,
    variant = 'field',
    className = '',
}: SelectProps<T>) {
    const [anchor, setAnchor] = useState<Anchor | null>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const listId = useId()

    const current = options.find((option) => option.value === value)

    const fieldClass = `select-field select-${variant} ${className}`
    const valueClass = `select-value truncate ${current?.className ?? ''}`
    const currentLabel = current?.label ?? PLACEHOLDER
    const isOpen = anchor !== null
    const minWidth = anchor ? anchor.right - anchor.left : 0

    function open() {
        if (!disabled) {
            setAnchor(buttonRef.current!.getBoundingClientRect())
        }
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

    function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            open()
        }
    }

    // The list closes itself (with its fade) on any option's click.
    function pick(option: SelectOption<T>) {
        if (option.value !== value) {
            onChange(option.value)
        }
    }

    return {
        anchor,
        buttonRef,
        listId,
        current,
        fieldClass,
        valueClass,
        currentLabel,
        isOpen,
        minWidth,
        optionViews: toOptionViews(options, value),
        close,
        toggle,
        handleKeyDown,
        pick,
    }
}
