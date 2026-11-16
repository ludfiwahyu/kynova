import type { ButtonVariant } from '@/components/ui/Button/types'

export const VARIANT_CLASSES: Record<ButtonVariant, string> = {
    default: 'button',
    primary: 'button primary',
    ghost: 'button ghost',
    danger: 'button danger',
    link: 'link-button',
    icon: 'icon-button',
    send: 'button send-button',
    topbarIcon: 'topbar-icon',
    statusbarText: 'statusbar-text',
    dbChoice: 'db-choice',
    swatch: 'swatch',
    plain: '',
}
