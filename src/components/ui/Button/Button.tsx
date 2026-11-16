import { VARIANT_CLASSES } from '@/components/ui/Button/logic/config'
import { buttonType } from '@/components/ui/Button/logic/helpers'
import type { ButtonProps } from '@/components/ui/Button/types'
import { classNames } from '@/components/utils/helpers'

export function Button({
    variant = 'default',
    submit = false,
    type,
    icon,
    iconEnd,
    className,
    children,
    ...rest
}: ButtonProps) {
    const classes = classNames(VARIANT_CLASSES[variant], className)

    return (
        <button
            type={buttonType(submit, type)}
            className={classes}
            {...rest}
        >
            {icon}
            {children}
            {iconEnd}
        </button>
    )
}
