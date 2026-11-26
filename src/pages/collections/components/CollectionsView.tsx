import { Ellipsis, LayoutDashboard, PanelLeft, Plus, Upload } from 'lucide-react'

import {
    Button,
    EmptyState,
    Input,
    Menu,
    MenuItem,
    SearchInput,
    SidebarSection,
    SidebarToolbar,
} from '@/components'
import { ArchiveList } from '@/pages/collections/components/ArchiveList'
import { SelectionBar } from '@/pages/collections/components/SelectionBar'
import { TreeRow } from '@/pages/collections/components/TreeRow'
import { useCollectionsView } from '@/pages/collections/hooks/useCollectionsView'
import {
    ACTIONS_ICON_SIZE,
    IMPORT_ACCEPT,
    MENU_ICON_SIZE,
    TOOLBAR_ICON_SIZE,
} from '@/pages/collections/logic/config'
import { EnvironmentList, newEnvironment } from '@/pages/environments'

export function CollectionsView() {
    const view = useCollectionsView()

    return (
        <div
            className="sidebar-body"
            data-dropping={view.isDropping || undefined}
            onDragOver={view.dragOver}
            onDragLeave={view.dragLeave}
            onDrop={view.drop}
        >
            <SidebarToolbar>
                <SearchInput
                    className="sidebar-filter"
                    aria-label="Filter collections"
                    placeholder="Filter"
                    value={view.filter}
                    onChange={view.changeFilter}
                />

                <Button
                    variant="icon"
                    icon={<Upload size={ACTIONS_ICON_SIZE} />}
                    title="Import collections or environments (JSON), or drop files here"
                    aria-label="Import"
                    disabled={!view.canEdit}
                    onClick={view.chooseFile}
                />

                <Menu
                    align="end"
                    label="Workspace"
                    trigger={(props) => (
                        <Button
                            variant="icon"
                            icon={<Ellipsis size={ACTIONS_ICON_SIZE} />}
                            aria-label="More"
                            title="More"
                            {...props}
                        />
                    )}
                >
                    <MenuItem
                        icon={<LayoutDashboard size={MENU_ICON_SIZE} />}
                        onSelect={view.openOverview}
                    >
                        Workspace overview
                    </MenuItem>

                    <MenuItem
                        icon={<PanelLeft size={MENU_ICON_SIZE} />}
                        onSelect={view.openCustomize}
                    >
                        Customize sidebar
                    </MenuItem>
                </Menu>

                <Input
                    variant="plain"
                    ref={view.fileInput}
                    type="file"
                    accept={IMPORT_ACCEPT}
                    multiple
                    hidden
                    onChange={view.handleFile}
                />
            </SidebarToolbar>

            {view.importError && (
                <p
                    className="sidebar-error"
                    role="alert"
                >
                    {view.importError}
                </p>
            )}

            <SidebarSection
                id="collections"
                title="Collections"
                grow
                actions={
                    <Button
                        variant="icon"
                        icon={<Plus size={TOOLBAR_ICON_SIZE} />}
                        title="New collection"
                        aria-label="New collection"
                        disabled={!view.canEdit}
                        onClick={view.newCollection}
                    />
                }
            >
                {view.isEmpty && (
                    <EmptyState
                        title="No collections yet"
                        action={
                            view.canEdit && (
                                <div className="row">
                                    <Button
                                        variant="primary"
                                        onClick={view.newCollection}
                                    >
                                        New collection
                                    </Button>

                                    <Button onClick={view.chooseFile}>Import</Button>
                                </div>
                            )
                        }
                    >
                        A collection groups related requests. Create one, or import collections and
                        environments (or drop the files here).
                    </EmptyState>
                )}

                {view.hasNoMatch && <p className="sidebar-note">{view.noMatchText}</p>}

                <SelectionBar />

                <div
                    ref={view.treeRef}
                    className="tree"
                    role="tree"
                    aria-label="Collections"
                    aria-multiselectable="true"
                >
                    {view.collections.map((collection) => (
                        <TreeRow
                            key={collection.id}
                            item={collection}
                            depth={0}
                            visible={view.visible}
                        />
                    ))}
                </div>
            </SidebarSection>

            {view.showEnvironments && (
                <SidebarSection
                    id="environments"
                    title="Environments"
                    actions={
                        <Button
                            variant="icon"
                            icon={<Plus size={TOOLBAR_ICON_SIZE} />}
                            title="New environment"
                            aria-label="New environment"
                            disabled={!view.canEdit}
                            onClick={newEnvironment}
                        />
                    }
                >
                    <EnvironmentList />
                </SidebarSection>
            )}

            <SidebarSection
                id="archive"
                title="Archive"
            >
                <ArchiveList />
            </SidebarSection>

            {view.isDropping && (
                <div
                    className="sidebar-drop"
                    aria-hidden="true"
                >
                    <Upload size={TOOLBAR_ICON_SIZE} />
                    Drop collections or environments to import
                </div>
            )}
        </div>
    )
}
