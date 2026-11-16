import { signOut, useSession } from '@/stores'

export function useAccountMenu() {
    const user = useSession((state) => state.user)

    function leave() {
        void signOut()
    }

    return {
        user,
        leave,
    }
}
