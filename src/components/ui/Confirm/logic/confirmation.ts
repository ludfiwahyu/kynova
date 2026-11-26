import { create } from 'zustand'

import type { ConfirmAnswer, Confirmation, ConfirmState } from '@/components/ui/Confirm/types'

export const useConfirmation = create<ConfirmState>(() => ({ current: null }))

export function choose(options: Omit<Confirmation, 'resolve'>): Promise<ConfirmAnswer> {
    return new Promise((resolve) =>
        useConfirmation.setState({
            current: {
                ...options,
                resolve,
            },
        }),
    )
}

export async function confirm(
    options: Omit<Confirmation, 'resolve' | 'alternative'>,
): Promise<boolean> {
    return (await choose(options)) === 'action'
}
