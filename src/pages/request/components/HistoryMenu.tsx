import { History } from 'lucide-react'

import { Button, Menu } from '@/components'
import { VersionDialog } from '@/pages/request/components/VersionDialog'
import { VersionList } from '@/pages/request/components/VersionList'
import { useHistoryMenu } from '@/pages/request/hooks/useHistoryMenu'
import { HEADER_ICON_SIZE } from '@/pages/request/logic/config'
import type { HistoryMenuProps } from '@/pages/request/types'

/** Saved versions of a request: who saved each and when; one opens to read or restore. */
export function HistoryMenu({ item }: HistoryMenuProps) {
    const menu = useHistoryMenu()

    return (
        <span className="contents">
            <Menu
                align="end"
                label="History"
                trigger={(props) => (
                    <Button
                        variant="icon"
                        icon={<History size={HEADER_ICON_SIZE} />}
                        aria-label="Saved versions"
                        title="Saved versions: who saved and when"
                        {...props}
                    />
                )}
            >
                <VersionList
                    item={item}
                    onOpen={menu.show}
                />
            </Menu>

            {menu.open && (
                <VersionDialog
                    item={item}
                    version={menu.open}
                    onClose={menu.close}
                />
            )}
        </span>
    )
}
