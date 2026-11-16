import { RefreshCw } from 'lucide-react'

import { Button } from '@/components'
import { useNewerSaveBanner } from '@/pages/request/hooks/useNewerSaveBanner'
import { HEADER_ICON_SIZE } from '@/pages/request/logic/config'
import type { NewerSaveBannerProps } from '@/pages/request/types'

/** Shown over a draft when someone saved the request after the draft began. Nothing is lost either way. */
export function NewerSaveBanner(props: NewerSaveBannerProps) {
    const banner = useNewerSaveBanner(props)

    if (!banner.isShown) {
        return null
    }

    return (
        <div
            className="newer-save"
            role="status"
        >
            <RefreshCw
                size={HEADER_ICON_SIZE}
                className="newer-save-icon"
            />

            <span className="grow">{banner.text}</span>

            <Button
                variant="primary"
                className="newer-save-button"
                onClick={banner.load}
            >
                Load new version
            </Button>

            <Button
                className="newer-save-button"
                title="Your next Save replaces their version; theirs stays in the history"
                onClick={banner.keep}
            >
                Keep editing
            </Button>
        </div>
    )
}
