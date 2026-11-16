import { Check, Settings2 } from 'lucide-react'

import { Button, Menu, MenuItem, MenuLabel, MenuSeparator } from '@/components'
import { useJsonStyleMenu } from '@/pages/request/hooks/useJsonStyleMenu'
import { CARET_ICON_SIZE, SETTINGS_ICON_SIZE } from '@/pages/request/logic/config'
import type { JsonStyleMenuProps } from '@/pages/request/types'
import { JSON_STYLES } from '@/utils'

export function JsonStyleMenu({ editorSettings = false }: JsonStyleMenuProps) {
    const menu = useJsonStyleMenu()

    const check = (
        <Check
            size={CARET_ICON_SIZE}
            className="menu-check"
        />
    )

    return (
        <Menu
            align="end"
            label="JSON style"
            trigger={(props) => (
                <Button
                    variant="icon"
                    icon={<Settings2 size={SETTINGS_ICON_SIZE} />}
                    aria-label="JSON style"
                    title="JSON style"
                    {...props}
                />
            )}
        >
            <MenuLabel>JSON style</MenuLabel>

            {JSON_STYLES.map(({ id, label, example }) => (
                <MenuItem
                    key={id}
                    checked={menu.jsonStyle === id}
                    icon={check}
                    onSelect={() => menu.chooseStyle(id)}
                >
                    <span className="menu-choice">
                        <span>{label}</span>
                        <code className="menu-example">{example}</code>
                    </span>
                </MenuItem>
            ))}

            {editorSettings && (
                <>
                    <MenuSeparator />
                    <MenuLabel>Editor</MenuLabel>

                    <MenuItem
                        toggle
                        checked={menu.bracketsOn}
                        icon={check}
                        onSelect={menu.toggleBrackets}
                    >
                        Auto closing brackets
                    </MenuItem>

                    <MenuItem
                        toggle
                        checked={menu.quotesOn}
                        icon={check}
                        onSelect={menu.toggleQuotes}
                    >
                        Auto closing quotes
                    </MenuItem>

                    <MenuItem
                        toggle
                        checked={menu.formatOnBlur}
                        icon={check}
                        onSelect={menu.toggleFormatOnBlur}
                    >
                        Format JSON on blur
                    </MenuItem>

                    <MenuItem
                        toggle
                        checked={menu.trailingComma}
                        icon={check}
                        onSelect={menu.toggleTrailingComma}
                    >
                        Trailing commas
                    </MenuItem>

                    <MenuSeparator />

                    <MenuItem
                        icon={<span />}
                        onSelect={menu.openMoreSettings}
                    >
                        More editor settings…
                    </MenuItem>
                </>
            )}
        </Menu>
    )
}
