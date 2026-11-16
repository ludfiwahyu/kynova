import { useState } from 'react'

import { BROWSER_KEPT_KEYS } from '@/pages/settings/logic/config'
import { toShortcutGroups } from '@/pages/settings/logic/mappers'
import { detectPlatform, type Platform } from '@/settings'

export function useShortcutsSection() {
    // Opens on the computer's own keys; the other set can be looked at too.
    const [platform, setPlatform] = useState<Platform>(detectPlatform)

    return {
        platform,
        groups: toShortcutGroups(platform),
        keptKeys: BROWSER_KEPT_KEYS[platform],
        setPlatform,
    }
}
