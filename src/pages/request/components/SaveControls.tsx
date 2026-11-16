import { ChevronsUpDown, CloudCheck, Save, Undo2 } from 'lucide-react'

import { Button, Menu, MenuItem, MenuSeparator } from '@/components'
import { HistoryMenu } from '@/pages/request/components/HistoryMenu'
import { SaveAsDialog } from '@/pages/request/components/SaveAsDialog'
import { useSaveControls } from '@/pages/request/hooks/useSaveControls'
import { HEADER_ICON_SIZE } from '@/pages/request/logic/config'
import type { SaveControlsProps } from '@/pages/request/types'

export function SaveControls(props: SaveControlsProps) {
    const { item } = props
    const controls = useSaveControls(props)

    return (
        <div className="save-controls">
            {controls.isDirty ? (
                <Button
                    variant="primary"
                    className="save-button"
                    icon={<Save size={HEADER_ICON_SIZE} />}
                    disabled={!controls.canEdit}
                    title={controls.canEdit ? 'Save for everyone (⌘S)' : 'Viewers cannot save'}
                    onClick={controls.save}
                >
                    Save
                </Button>
            ) : (
                <span
                    className="save-status"
                    title={controls.savedLabel}
                >
                    <CloudCheck size={HEADER_ICON_SIZE} />
                    {controls.justSaved ? 'Saved just now' : 'Saved'}
                </span>
            )}

            <Menu
                align="end"
                label="Save options"
                trigger={(triggerProps) => (
                    <Button
                        variant="icon"
                        icon={<ChevronsUpDown size={HEADER_ICON_SIZE} />}
                        aria-label="Save options"
                        {...triggerProps}
                    />
                )}
            >
                <MenuItem
                    hint="⇧⌘S"
                    disabled={!controls.canEdit}
                    onSelect={controls.openSaveAs}
                >
                    Save As…
                </MenuItem>

                {controls.isDirty && (
                    <>
                        <MenuSeparator />

                        <MenuItem
                            icon={<Undo2 size={HEADER_ICON_SIZE} />}
                            onSelect={controls.discard}
                        >
                            Discard changes
                        </MenuItem>
                    </>
                )}
            </Menu>

            <HistoryMenu item={item} />

            {controls.isSavingAs && (
                <SaveAsDialog
                    item={item}
                    onClose={controls.closeSaveAs}
                />
            )}
        </div>
    )
}
