import { MenuItem, MenuLabel } from '@/components'
import { useVersionList } from '@/pages/request/hooks/useHistoryMenu'
import type { VersionListProps } from '@/pages/request/types'

export function VersionList({ item, onOpen }: VersionListProps) {
    const list = useVersionList({ item })

    return (
        <div className="contents">
            <MenuLabel>Saved versions</MenuLabel>

            {list.isLoading && (
                <MenuItem
                    disabled
                    onSelect={() => {}}
                >
                    Loading…
                </MenuItem>
            )}

            {list.isEmpty && (
                <MenuItem
                    disabled
                    onSelect={() => {}}
                >
                    No saves yet. Each Save adds one.
                </MenuItem>
            )}

            {list.rows.map((row) => (
                <MenuItem
                    key={row.version.id}
                    hint={row.when}
                    onSelect={() => onOpen(row.version)}
                >
                    {row.isCurrent ? `${row.who} · current` : row.who}
                </MenuItem>
            ))}
        </div>
    )
}
