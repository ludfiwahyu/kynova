import { LibraryBig } from 'lucide-react'

import { EMPTY_ICON_SIZE } from '@/components/ui/ColorTagButton/logic/config'
import type { ColorTagButtonProps } from '@/components/ui/ColorTagButton/types'
import { ColorTagPicker } from '@/components/ui/ColorTagPicker/ColorTagPicker'
import { tagAttributes } from '@/components/ui/ColorTagPicker/logic/helpers'
import { Menu } from '@/components/ui/Menu/Menu'

/** The rounded square left of a name: shows the colour tag, and opens the colours when clicked. */
export function ColorTagButton({ color, disabled, onChange }: ColorTagButtonProps) {
    const mark = color ? null : <LibraryBig size={EMPTY_ICON_SIZE} />

    if (disabled) {
        return (
            <span
                className="tag-dot"
                data-empty={!color || undefined}
                {...tagAttributes(color)}
            >
                {mark}
            </span>
        )
    }

    // The menu renders in a portal, but React still bubbles its clicks to the row: stop them
    // here, so choosing a colour does not also open or fold the collection.
    return (
        <span
            className="contents"
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={(event) => event.stopPropagation()}
        >
            <Menu
                label="Color tag"
                trigger={(props) => (
                    <button
                        type="button"
                        className="tag-dot tag-trigger"
                        data-empty={!color || undefined}
                        aria-label={color ? `Color tag: ${color}` : 'Add a color tag'}
                        title={color ? 'Color tag' : 'Add a color tag'}
                        {...tagAttributes(color)}
                        {...props}
                    >
                        {mark}
                    </button>
                )}
            >
                <ColorTagPicker
                    value={color}
                    onChange={onChange}
                />
            </Menu>
        </span>
    )
}
