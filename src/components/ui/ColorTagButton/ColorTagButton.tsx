import type { ColorTagButtonProps } from '@/components/ui/ColorTagButton/types'
import { ColorTagPicker } from '@/components/ui/ColorTagPicker/ColorTagPicker'
import { tagAttributes } from '@/components/ui/ColorTagPicker/logic/helpers'
import { Menu } from '@/components/ui/Menu/Menu'

/** The rounded square left of a name: shows the colour tag, and opens the colours when clicked. */
export function ColorTagButton({ color, disabled, onChange }: ColorTagButtonProps) {
    if (disabled) {
        return (
            <span
                className="tag-dot"
                {...tagAttributes(color)}
            />
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
                        aria-label={color ? `Color tag: ${color}` : 'Add a color tag'}
                        title="Color tag"
                        {...tagAttributes(color)}
                        {...props}
                    />
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
