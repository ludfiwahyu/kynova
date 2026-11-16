import { CircleCheck, Ellipsis } from 'lucide-react'

import { Button, ColorTagButton, Menu, useContextMenu } from '@/components'
import { EnvironmentMenuItems } from '@/pages/environments/components/EnvironmentMenuItems'
import { useEnvironmentRow } from '@/pages/environments/hooks/useEnvironmentRow'
import { ACTIONS_ICON_SIZE, ROW_ICON_SIZE } from '@/pages/environments/logic/config'
import type { EnvironmentRowProps } from '@/pages/environments/types'

export function EnvironmentRow({ environment }: EnvironmentRowProps) {
    const row = useEnvironmentRow(environment)
    const contextMenu = useContextMenu(() => <EnvironmentMenuItems row={row} />)

    return (
        <div className="environment-row">
            <div
                className="tree-row"
                role="treeitem"
                aria-selected={row.isOpen}
                tabIndex={0}
                onClick={row.open}
                onDoubleClick={row.keep}
                onContextMenu={contextMenu.onContextMenu}
                onKeyDown={row.handleKeyDown}
            >
                <ColorTagButton
                    color={environment.color}
                    disabled={!row.canEdit}
                    onChange={row.setColor}
                />
                <span className="tree-name truncate">{environment.name}</span>

                {row.isActive && (
                    <CircleCheck
                        size={ROW_ICON_SIZE}
                        className="environment-active"
                        aria-label="Active environment"
                    />
                )}

                <span
                    className="tree-actions"
                    onClick={row.stopClick}
                >
                    <Menu
                        label={row.actionsLabel}
                        trigger={(props) => (
                            <Button
                                variant="icon"
                                icon={<Ellipsis size={ACTIONS_ICON_SIZE} />}
                                aria-label={row.actionsLabel}
                                tabIndex={-1}
                                {...props}
                            />
                        )}
                    >
                        <EnvironmentMenuItems row={row} />
                    </Menu>
                </span>
            </div>

            {contextMenu.menu}
        </div>
    )
}
