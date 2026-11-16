import type { ButtonProps } from '@/components/ui/Button/types'

export function buttonType(submit: boolean, type: ButtonProps['type']): ButtonProps['type'] {
    if (submit) {
        return 'submit'
    }

    return type ?? 'button'
}
