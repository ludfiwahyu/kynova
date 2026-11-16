import type { VersionDialogProps } from '@/pages/request/types'
import { restoreVersion, useCanEdit } from '@/stores'
import { formatWhen } from '@/utils'

export function useVersionDialog({ item, version, onClose }: VersionDialogProps) {
    const canEdit = useCanEdit()
    const isCurrent = item.savedAt === version.savedAt

    const summary =
        version.kind === 'http' && version.request
            ? `${version.request.method} ${version.request.url || '(no URL)'}`
            : `WS ${version.url || '(no URL)'}`
    const content = JSON.stringify(
        version.kind === 'http'
            ? {
                  request: version.request,
                  scripts: version.scripts,
              }
            : {
                  url: version.url,
                  scripts: version.scripts,
              },
        null,
        2,
    )

    function restore() {
        restoreVersion(version)
        onClose()
    }

    return {
        title: `${version.savedBy}, ${formatWhen(version.savedAt)}`,
        summary,
        content,
        canRestore: canEdit && !isCurrent,
        restoreTitle: isCurrent ? 'This is the saved version' : 'Save this version as the newest',
        restore,
        ignoreEdit: () => {},
    }
}
