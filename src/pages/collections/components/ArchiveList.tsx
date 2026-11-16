import { ArchiveRow } from '@/pages/collections/components/ArchiveRow'
import { useArchiveList } from '@/pages/collections/hooks/useArchiveList'

/** Deleted collections, folders and requests, newest first. */
export function ArchiveList() {
    const list = useArchiveList()

    return (
        <div
            className="tree"
            role="list"
            aria-label="Archive"
        >
            {list.isEmpty && (
                <p className="sidebar-note">Deleted items land here, ready to restore.</p>
            )}

            {list.entries.map((entry) => (
                <ArchiveRow
                    key={entry.id}
                    entry={entry}
                />
            ))}
        </div>
    )
}
