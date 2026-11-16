import { Check, ChevronsUpDown } from 'lucide-react'

import { Button } from '@/components/ui/Button/Button'
import { Popover } from '@/components/ui/Menu/components/Popover'
import { useSelect } from '@/components/ui/Select/hooks/useSelect'
import { ICON_SIZE } from '@/components/ui/Select/logic/config'
import type { SelectProps } from '@/components/ui/Select/types'

export function Select<T extends string>(props: SelectProps<T>) {
    const { label, disabled, data } = props
    const select = useSelect(props)

    return (
        <span className="contents">
            <Button
                ref={select.buttonRef}
                variant="plain"
                className={select.fieldClass}
                aria-label={label}
                aria-haspopup="listbox"
                aria-expanded={select.isOpen}
                aria-controls={select.isOpen ? select.listId : undefined}
                disabled={disabled}
                onClick={select.toggle}
                onKeyDown={select.handleKeyDown}
                {...data}
            >
                {select.current?.icon && <span className="select-icon">{select.current.icon}</span>}

                <span className={select.valueClass}>{select.currentLabel}</span>

                <ChevronsUpDown
                    size={ICON_SIZE}
                    className="select-chevron"
                />
            </Button>

            {select.anchor && (
                <Popover
                    anchor={select.anchor}
                    align="start"
                    role="listbox"
                    label={label}
                    onClose={select.close}
                    minWidth={select.minWidth}
                    opener={select.buttonRef.current}
                >
                    <div id={select.listId}>
                        {select.optionViews.map((view) => [
                            view.option.startsGroup && (
                                <div
                                    key={view.lineKey}
                                    className="menu-separator"
                                    role="separator"
                                />
                            ),

                            <Button
                                key={view.option.value}
                                variant="plain"
                                className={view.className}
                                role="option"
                                aria-selected={view.isSelected}
                                tabIndex={-1}
                                onClick={() => select.pick(view.option)}
                            >
                                {view.option.icon && (
                                    <span className="menu-icon">{view.option.icon}</span>
                                )}

                                <span className="grow">
                                    <span className="select-option-label truncate">
                                        {view.option.label}
                                    </span>

                                    {view.option.hint && (
                                        <span className="select-option-hint">
                                            {view.option.hint}
                                        </span>
                                    )}
                                </span>

                                <Check
                                    size={ICON_SIZE}
                                    className="select-check"
                                />
                            </Button>,
                        ])}
                    </div>
                </Popover>
            )}
        </span>
    )
}
