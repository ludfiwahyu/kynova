import { Check, ChevronsUpDown } from 'lucide-react'

import { Button, Input, Popover } from '@/components'
import { useMethodSelect } from '@/pages/request/hooks/useMethodSelect'
import { CARET_ICON_SIZE, MAX_METHOD_LENGTH } from '@/pages/request/logic/config'
import type { MethodSelectProps } from '@/pages/request/types'

export function MethodSelect(props: MethodSelectProps) {
    const { value, disabled } = props
    const select = useMethodSelect(props)

    return (
        <span className="contents">
            <Button
                variant="plain"
                className="select-field select-quiet method-select"
                ref={select.buttonRef}
                aria-label="HTTP method"
                aria-haspopup="listbox"
                aria-expanded={select.isOpen}
                disabled={disabled}
                onClick={select.toggle}
                onKeyDown={select.handleButtonKeyDown}
            >
                <span className={select.valueClass}>{value}</span>

                <ChevronsUpDown
                    size={CARET_ICON_SIZE}
                    className="select-chevron"
                />
            </Button>

            {select.anchor && (
                <Popover
                    anchor={select.anchor}
                    align="start"
                    role="listbox"
                    label="HTTP method"
                    onClose={select.close}
                    minWidth={select.minWidth}
                    opener={select.buttonRef.current}
                >
                    {select.options.map((option) => (
                        <Button
                            key={option.method}
                            variant="plain"
                            className="menu-item select-option"
                            role="option"
                            aria-selected={option.isSelected}
                            tabIndex={-1}
                            onClick={() => select.pick(option.method)}
                        >
                            <span className={option.textClass}>{option.method}</span>

                            <Check
                                size={CARET_ICON_SIZE}
                                className="select-check"
                            />
                        </Button>
                    ))}

                    <div
                        className="menu-separator"
                        role="separator"
                    />

                    <form
                        className="method-custom"
                        onSubmit={select.submitCustom}
                    >
                        <Input
                            variant="plain"
                            className="method-custom-field"
                            aria-label="Type a new method"
                            placeholder="Type a new method"
                            value={select.draft}
                            maxLength={MAX_METHOD_LENGTH}
                            spellCheck={false}
                            autoCapitalize="characters"
                            onValueChange={select.changeDraft}
                            onKeyDown={select.handleDraftKeyDown}
                        />

                        {select.error && (
                            <p
                                className="method-custom-error"
                                role="alert"
                            >
                                {select.error}
                            </p>
                        )}
                    </form>
                </Popover>
            )}
        </span>
    )
}
