import { useConfirmation } from '@/components/ui/Confirm/logic/confirmation'
import type { ConfirmAnswer } from '@/components/ui/Confirm/types'

export function useConfirmHost() {
    const current = useConfirmation((state) => state.current)

    function answer(chosen: ConfirmAnswer) {
        current?.resolve(chosen)
        useConfirmation.setState({ current: null })
    }

    function cancel() {
        answer('cancel')
    }

    function accept() {
        answer('action')
    }

    function acceptAlternative() {
        answer('alternative')
    }

    return {
        current,
        acceptAlternative,
        cancel,
        accept,
    }
}
