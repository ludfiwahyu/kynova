import { useEffect, useRef, useState } from 'react'

import { RESPONSE_ENTER_SECONDS } from '@/pages/request/logic/config'
import { toResponseMeta, toViewTabs } from '@/pages/request/logic/mappers'
import type { ResponseViewerProps, View } from '@/pages/request/types'
import { detectPlatform, keysFor, SHORTCUTS } from '@/settings'
import { enter, formatBytes } from '@/utils'

export function useResponseViewer({ state }: ResponseViewerProps) {
    const [view, setView] = useState<View>('body')
    const paneRef = useRef<HTMLElement>(null)

    const response = state?.status === 'done' ? state.response : null

    // Each new response fades in; the pane stays, so its toggles keep their place.
    useEffect(() => {
        if (response && paneRef.current) {
            enter(paneRef.current, { duration: RESPONSE_ENTER_SECONDS })
        }
    }, [response])

    const isDone = response !== null
    const sendKeys = keysFor(SHORTCUTS['request.send'], detectPlatform())
    const tabs = response ? toViewTabs(response.headers.length) : []
    const meta = response ? toResponseMeta(response) : null
    const warning = response?.truncated
        ? `The response was larger than ${formatBytes(response.limitBytes)}, the size limit, so only that much is shown. Change the limit in Settings › General.`
        : null

    return {
        view,
        paneRef,
        response,
        isDone,
        isIdle: !state,
        isSending: state?.status === 'sending',
        isFailed: state?.status === 'failed',
        sendKeys,
        tabs,
        meta,
        warning,
        setView,
    }
}
