import { INPUT_CLASSES } from '@/components/ui/Input/logic/config'
import type { InputProps } from '@/components/ui/Input/types'
import { classNames, valueChange } from '@/components/utils/helpers'

export function Input({
    variant = 'default',
    className,
    onChange,
    onValueChange,
    ...rest
}: InputProps) {
    const classes = classNames(INPUT_CLASSES[variant], className)

    return (
        <input
            className={classes}
            onChange={valueChange(onChange, onValueChange)}
            {...rest}
        />
    )
}
