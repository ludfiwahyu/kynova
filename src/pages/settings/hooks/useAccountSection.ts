import { signOut, useSession } from '@/stores'

export function useAccountSection() {
    const user = useSession((state) => state.user)
    const workspaces = useSession((state) => state.workspaces)

    function leave() {
        void signOut()
    }

    return {
        user,
        workspaceCount: workspaces.length,
        leave,
    }
}
