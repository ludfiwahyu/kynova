import { TEXTAREA_CLASSES } from '@/components/ui/TextArea/logic/config'
import type { TextAreaProps } from '@/components/ui/TextArea/types'
import { classNames, valueChange } from '@/components/utils/helpers'

export function TextArea({
    variant = 'default',
    className,
    onChange,
    onValueChange,
    ...rest
}: TextAreaProps) {
    const classes = classNames(TEXTAREA_CLASSES[variant], className)

    return (
        <textarea
            className={classes}
            onChange={valueChange(onChange, onValueChange)}
            {...rest}
        />
    )
}
