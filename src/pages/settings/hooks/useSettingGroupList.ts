import type { SettingGroup } from '@/settings'
import { setPreferences } from '@/settings'

export function useSettingGroupList() {
    function reset(group: SettingGroup) {
        if (group.reset) {
            setPreferences(group.reset)
        }
    }

    return { reset }
}
