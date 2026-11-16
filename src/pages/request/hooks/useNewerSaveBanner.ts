import type { NewerSaveBannerProps } from '@/pages/request/types'
import { discardDraft, keepDraft, useDraft } from '@/stores'
import { formatWhen } from '@/utils'

export function useNewerSaveBanner({ item }: NewerSaveBannerProps) {
    const { hasNewerSave } = useDraft(item.id)

    const who = item.savedBy ?? 'Someone'
    const when = item.savedAt ? formatWhen(item.savedAt) : ''

    return {
        isShown: hasNewerSave,
        text: `${who} saved a newer version${when ? `, ${when}` : ''}. Your changes are not saved yet.`,
        load: () => discardDraft(item.id),
        keep: () => keepDraft(item.id),
    }
}
