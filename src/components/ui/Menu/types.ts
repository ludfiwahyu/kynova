import type { MouseEvent, ReactNode } from 'react'

export interface Anchor {
    left: number
    right: number
    top: number
    bottom: number
}

export interface PopoverProps {
    anchor: Anchor
    align: 'start' | 'end'
    onClose: () => void
    label?: string
    /** `listbox` for a Select's options. */
    role?: 'menu' | 'listbox'
    /** At least this wide, such as the width of the field that opened it. */
    minWidth?: number
    /**
     * The element that opened it. Inside a modal dialog the popover renders in
     * that dialog: everything outside an open modal is inert and drawn beneath it.
     */
    opener?: Element | null
    children: ReactNode
}

export type PopoverOptions = Pick<
    PopoverProps,
    'anchor' | 'align' | 'onClose' | 'minWidth' | 'opener'
>

export interface MenuProps {
    /** Renders the element that opens the menu. Spread `props` onto a button. */
    trigger: (props: {
        onClick: (event: MouseEvent) => void
        'aria-expanded': boolean
        'aria-haspopup': 'menu'
    }) => ReactNode
    /** Which edge of the trigger the menu lines up with. */
    align?: 'start' | 'end'
    label?: string
    children: ReactNode
}

export interface MenuItemProps {
    onSelect: () => void
    icon?: ReactNode
    danger?: boolean
    disabled?: boolean
    /** Set for items that act as a single choice in a group, or as an on/off toggle with `toggle`. */
    checked?: boolean
    /** An on/off item (menuitemcheckbox) rather than one choice of several. */
    toggle?: boolean
    /** A keyboard shortcut shown at the right, such as "⌘D". Only for shortcuts that work. */
    hint?: string
    children: ReactNode
}
