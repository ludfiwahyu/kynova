import { useState } from 'react'

import { databaseSummary } from '@/pages/database/logic/helpers'
import { useDatabase } from '@/stores'

export function useDatabaseStatus() {
    const current = useDatabase((state) => state.current)
    const [isOpen, setIsOpen] = useState(false)

    const summary = current ? databaseSummary(current) : ''
    const title = current ? `${current.label}: ${current.detail}` : ''

    function open() {
        setIsOpen(true)
    }

    function close() {
        setIsOpen(false)
    }

    return {
        current,
        isOpen,
        summary,
        title,
        open,
        close,
    }
}
