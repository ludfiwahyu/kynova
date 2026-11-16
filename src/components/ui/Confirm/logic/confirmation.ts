import { create } from 'zustand'

import type { Confirmation, ConfirmState } from '@/components/ui/Confirm/types'

export const useConfirmation = create<ConfirmState>(() => ({ current: null }))

export function confirm(options: Omit<Confirmation, 'resolve'>): Promise<boolean> {
    return new Promise((resolve) =>
        useConfirmation.setState({
            current: {
                ...options,
                resolve,
            },
        }),
    )
}
