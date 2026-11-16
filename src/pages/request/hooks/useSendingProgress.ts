import { useEffect, useState } from 'react'

import { MAX_PROGRESS_PERCENT, PROGRESS_TICK_MS } from '@/pages/request/logic/config'
import type { SendingProgressProps } from '@/pages/request/types'
import { formatBytes, formatDuration } from '@/utils'

export function useSendingProgress({ startedAt, progress }: SendingProgressProps) {
    const [now, setNow] = useState(Date.now())

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), PROGRESS_TICK_MS)

        return () => clearInterval(timer)
    }, [])

    const received = progress?.received ?? 0
    const total = progress?.total ?? null

    // Below 100 until the whole response is in: the last step is putting it on screen.
    const percent = total
        ? Math.min(MAX_PROGRESS_PERCENT, Math.floor((received / total) * 100))
        : null
    const waited = formatDuration(now - startedAt)

    let label = `Waiting for response · ${waited}`

    if (percent !== null && total) {
        label = `${percent}% · ${formatBytes(received)} of ${formatBytes(total)}`
    } else if (received > 0) {
        label = `${formatBytes(received)} received · ${waited}`
    }

    return {
        percent,
        label,
        barStyle: { width: `${percent}%` },
    }
}
