import { useConfirmation } from '@/components/ui/Confirm/logic/confirmation'

export function useConfirmHost() {
    const current = useConfirmation((state) => state.current)

    function answer(confirmed: boolean) {
        current?.resolve(confirmed)
        useConfirmation.setState({ current: null })
    }

    function cancel() {
        answer(false)
    }

    function accept() {
        answer(true)
    }

    return {
        current,
        cancel,
        accept,
    }
}
