import { Check, Pipette } from 'lucide-react'

import { useColorTagPicker } from '@/components/ui/ColorTagPicker/hooks/useColorTagPicker'
import { tagAttributes } from '@/components/ui/ColorTagPicker/logic/helpers'
import type { ColorTagPickerProps } from '@/components/ui/ColorTagPicker/types'
import { TAG_COLORS } from '#shared/types.ts'

/** Colour squares for a menu (none first, then each colour, the chosen one ticked), and any colour by hex. */
export function ColorTagPicker(props: ColorTagPickerProps) {
    const { value, onChange } = props
    const picker = useColorTagPicker(props)

    return (
        <div className="color-tag-picker">
            <div
                className="color-tags"
                role="group"
                aria-label="Color tag"
            >
                <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={value === undefined}
                    aria-label="No color"
                    title="No color"
                    tabIndex={-1}
                    className="color-tag"
                    onClick={() => onChange(undefined)}
                />

                {TAG_COLORS.map((color) => (
                    <button
                        key={color}
                        type="button"
                        role="menuitemradio"
                        aria-checked={value === color}
                        aria-label={color}
                        title={color}
                        tabIndex={-1}
                        className="color-tag"
                        data-tag={color}
                        onClick={() => onChange(color)}
                    >
                        {value === color && <Check size={14} />}
                    </button>
                ))}
            </div>

            <div
                className="menu-separator"
                role="separator"
            />

            <form
                className="color-tag-custom"
                onSubmit={picker.submit}
            >
                <label
                    className="color-tag color-tag-native"
                    title="Pick any color"
                    {...tagAttributes(picker.hexColor)}
                >
                    <Pipette size={13} />

                    <input
                        type="color"
                        aria-label="Pick any color"
                        value={picker.swatch}
                        onChange={(event) => picker.changeDraft(event.target.value)}
                    />
                </label>

                <input
                    className="color-tag-hex"
                    aria-label="Hex color"
                    placeholder="#3b72e1"
                    maxLength={7}
                    spellCheck={false}
                    value={picker.draft}
                    onChange={(event) => picker.changeDraft(event.target.value)}
                    onKeyDown={picker.keepCaretKeys}
                />

                <button
                    type="submit"
                    role="menuitem"
                    className="color-tag-apply"
                    disabled={!picker.isValid}
                >
                    Apply
                </button>
            </form>
        </div>
    )
}
