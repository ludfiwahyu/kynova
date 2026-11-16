import { useState } from 'react'

export function useTopBar() {
    const [isSharing, setIsSharing] = useState(false)

    function openInvite() {
        setIsSharing(true)
    }

    function closeInvite() {
        setIsSharing(false)
    }

    return {
        isSharing,
        openInvite,
        closeInvite,
    }
}
