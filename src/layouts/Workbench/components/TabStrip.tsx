import { ChevronsUpDown, Plus } from 'lucide-react'

import { Button, Menu, MenuItem, MenuSeparator } from '@/components'
import { TabButton } from '@/layouts/Workbench/components/TabButton'
import { TabListItem } from '@/layouts/Workbench/components/TabListItem'
import { useTabStrip } from '@/layouts/Workbench/hooks/useTabStrip'
import { NEW_ICON_SIZE, STRIP_ICON_SIZE } from '@/layouts/Workbench/logic/config'
import { EnvironmentSelect } from '@/pages/environments'

export function TabStrip() {
    const strip = useTabStrip()
    const hasTabs = strip.tabs.length > 0

    return (
        <div className="tab-strip">
            <div
                ref={strip.stripRef}
                className="doc-tabs"
                role="tablist"
                aria-label="Open tabs"
            >
                {strip.tabs.map((tab) => (
                    <TabButton
                        key={strip.tabKey(tab)}
                        tab={tab}
                        register={(element) => strip.register(tab, element)}
                        onPointerDown={(event) => strip.startDrag(event, tab)}
                        onClose={() => strip.closeWithFade(tab)}
                    />
                ))}

                <Button
                    variant="icon"
                    className="tab-strip-new"
                    icon={<Plus size={NEW_ICON_SIZE} />}
                    aria-label="New request"
                    title="New request"
                    disabled={!strip.canEdit}
                    onClick={strip.newRequest}
                />
            </div>

            <div className="tab-strip-end">
                <Menu
                    align="end"
                    label="Open tabs"
                    trigger={(props) => (
                        <Button
                            variant="icon"
                            icon={<ChevronsUpDown size={STRIP_ICON_SIZE} />}
                            aria-label="All open tabs"
                            title="All open tabs"
                            {...props}
                        />
                    )}
                >
                    {!hasTabs && (
                        <MenuItem
                            disabled
                            onSelect={() => {}}
                        >
                            No open tabs
                        </MenuItem>
                    )}

                    {hasTabs && (
                        <>
                            {strip.tabs.map((tab) => (
                                <TabListItem
                                    key={strip.tabKey(tab)}
                                    tab={tab}
                                />
                            ))}

                            <MenuSeparator />

                            <MenuItem onSelect={strip.closeAll}>Close all tabs</MenuItem>
                        </>
                    )}
                </Menu>

                <EnvironmentSelect />
            </div>
        </div>
    )
}
