import { confirm } from '@/components'
import { KIND_BADGE, REQUEST_TYPES } from '@/pages/request/logic/config'
import type { KindPickerProps, RequestItem } from '@/pages/request/types'
import { conversionLosesData, convertRequest, useCanEdit } from '@/stores'

export function useKindPicker({ item }: KindPickerProps) {
    const canEdit = useCanEdit()

    const current = REQUEST_TYPES.find((type) => type.kind === item.kind)!
    const badge = KIND_BADGE[current.kind]
    const triggerLabel = `Request type: ${current.label}`

    async function convert(kind: RequestItem['kind']) {
        if (kind === item.kind) {
            return
        }

        if (conversionLosesData(item)) {
            const confirmed = await confirm({
                title: `Make ${item.name} a WebSocket request?`,
                message:
                    'Its method, headers, auth and body are removed. The URL, documentation, scripts and comments stay.',
                action: 'Switch to WebSocket',
            })

            if (!confirmed) {
                return
            }
        }

        convertRequest(item, kind)
    }

    function switchTo(kind: RequestItem['kind']) {
        void convert(kind)
    }

    return {
        canEdit,
        badge,
        triggerLabel,
        types: REQUEST_TYPES,
        switchTo,
    }
}
