import { useState } from 'react'

import { COPIED_LABEL_MS } from '@/constants'

export function useCopyButton(text: string) {
    const [isCopied, setIsCopied] = useState(false)

    async function write() {
        await navigator.clipboard.writeText(text)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), COPIED_LABEL_MS)
    }

    function copy() {
        void write()
    }

    return {
        isCopied,
        copy,
    }
}
