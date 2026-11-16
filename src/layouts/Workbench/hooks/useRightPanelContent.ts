import { SUBJECT } from '@/layouts/Workbench/logic/config'
import { panelContentKind } from '@/layouts/Workbench/logic/helpers'
import type { RightPanelContentProps } from '@/layouts/Workbench/types'
import { saveItem, useCanEdit, useDraft } from '@/stores'

export function useRightPanelContent({ panel, item }: RightPanelContentProps) {
    const canEdit = useCanEdit()
    // The snippet and the variables follow the draft; the docs stay live.
    const draftItem = useDraft(item?.id).item

    const kind = panelContentKind(panel, item)
    const subject = item ? SUBJECT[item.kind] : ''
    const openText = `Open a collection, folder or request to see its ${panel === 'docs' ? 'documentation' : panel}.`

    function changeDescription(description: string) {
        if (item) {
            saveItem({
                ...item,
                description,
            })
        }
    }

    return {
        kind,
        draftItem,
        canEdit,
        subject,
        openText,
        changeDescription,
    }
}
