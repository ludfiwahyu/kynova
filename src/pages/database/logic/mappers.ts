import { Cloud, HardDrive } from 'lucide-react'
import { createElement } from 'react'

import { CHOICE_ICON_SIZE, DB_CHOICES, KIND_NAME } from '@/pages/database/logic/config'
import type { ChoiceView, RecentRow } from '@/pages/database/types'
import type { DatabaseStatus } from '@/services'

export function toChoiceViews(): ChoiceView[] {
    return DB_CHOICES.map((choice) => ({
        ...choice,
        icon: createElement(choice.id === 'local' ? HardDrive : Cloud, { size: CHOICE_ICON_SIZE }),
    }))
}

export function toRecentRows(recent: DatabaseStatus[], currentId?: string): RecentRow[] {
    return recent.map((database) => ({
        id: database.id,
        label: `${database.kind === 'supabase' ? KIND_NAME.supabase : KIND_NAME.postgres}· ${database.detail}`,
        inUse: database.id === currentId,
        forgetLabel: `Forget ${database.detail}`,
    }))
}
