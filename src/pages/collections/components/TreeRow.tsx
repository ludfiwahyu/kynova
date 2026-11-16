import { ChevronRight, Ellipsis, Plus } from 'lucide-react'

import { Button, ColorTagButton, InlineEdit, ItemGlyph, Menu, useContextMenu } from '@/components'
import { ItemMenuItems } from '@/pages/collections/components/ItemMenuItems'
import { SelectionMenuItems } from '@/pages/collections/components/SelectionMenuItems'
import { Watchers } from '@/pages/collections/components/Watchers'
import { useTreeRow } from '@/pages/collections/hooks/useTreeRow'
import { ACTIONS_ICON_SIZE, CHEVRON_ICON_SIZE } from '@/pages/collections/logic/config'
import type { TreeRowProps } from '@/pages/collections/types'

export function TreeRow(props: TreeRowProps) {
    const { item, depth, visible } = props
    const row = useTreeRow(props)

    const renderMenuItems = () =>
        row.usesSelectionMenu() ? (
            <SelectionMenuItems />
        ) : (
            <ItemMenuItems
                item={item}
                canEdit={row.canEdit}
                onRename={row.startRenaming}
            />
        )

    const contextMenu = useContextMenu(renderMenuItems)

    return (
        <div className="tree-node">
            <div
                className="tree-row"
                role="treeitem"
                aria-level={depth + 1}
                aria-expanded={row.ariaExpanded}
                aria-selected={row.ariaSelected}
                data-item-id={item.id}
                data-drop={row.dropZone}
                data-dragging={row.isDragged}
                data-landed={row.isLanded}
                draggable={row.draggable}
                tabIndex={0}
                style={row.styles.row}
                onDragStart={row.drag.dragStart}
                onDragOver={row.drag.dragOver}
                onDragLeave={row.drag.dragLeave}
                onDrop={row.drag.drop}
                onDragEnd={row.drag.dragEnd}
                onClick={row.handleClick}
                onDoubleClick={row.keep}
                onAuxClick={row.openBehind}
                onKeyDown={row.handleKeyDown}
                onContextMenu={(event) => {
                    row.prepareContextMenu()
                    contextMenu.onContextMenu(event)
                }}
            >
                <span
                    className="tree-chevron"
                    data-open={!row.isCollapsed}
                    data-hidden={!row.isContainer}
                    onClick={row.foldOnly}
                >
                    <ChevronRight size={CHEVRON_ICON_SIZE} />
                </span>

                {item.kind === 'collection' && (
                    <ColorTagButton
                        color={item.color}
                        disabled={!row.canEdit}
                        onChange={row.setColor}
                    />
                )}

                {item.kind !== 'collection' && <ItemGlyph item={item} />}

                {row.isRenaming ? (
                    <InlineEdit
                        label={row.renameLabel}
                        value={item.name}
                        onSave={row.saveName}
                        onCancel={row.stopRenaming}
                    />
                ) : (
                    <span className="tree-name truncate">{item.name}</span>
                )}

                <Watchers itemId={item.id} />

                {row.showActions && (
                    <span
                        className="tree-actions"
                        onClick={row.stopClick}
                    >
                        {row.showAddRequest && (
                            <Button
                                variant="icon"
                                icon={<Plus size={ACTIONS_ICON_SIZE} />}
                                aria-label={row.addLabel}
                                title="Add request"
                                tabIndex={-1}
                                onClick={row.addRequest}
                            />
                        )}

                        <Menu
                            align="start"
                            label={row.actionsLabel}
                            trigger={(triggerProps) => (
                                <Button
                                    variant="icon"
                                    icon={<Ellipsis size={ACTIONS_ICON_SIZE} />}
                                    aria-label={row.actionsLabel}
                                    tabIndex={-1}
                                    {...triggerProps}
                                />
                            )}
                        >
                            {renderMenuItems()}
                        </Menu>
                    </span>
                )}
            </div>

            {contextMenu.menu}

            {row.showGroup && (
                <div
                    ref={row.groupRef}
                    role="group"
                    className="tree-group"
                    style={row.styles.group}
                >
                    {row.children.map((child) => (
                        <TreeRow
                            key={child.id}
                            item={child}
                            depth={depth + 1}
                            visible={visible}
                        />
                    ))}

                    {row.showEmptyNote && (
                        <p
                            className="tree-empty"
                            style={row.styles.empty}
                        >
                            {row.emptyText}
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}
