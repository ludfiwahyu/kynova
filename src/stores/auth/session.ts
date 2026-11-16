/** Who is signed in, and which of their workspaces is open. */
import { create } from 'zustand'

import { api } from '@/services'
import type { User, Workspace } from '#shared/types.ts'

const ACTIVE_WORKSPACE_KEY = 'kynova.activeWorkspace'
const FIRST_WORKSPACE_NAME = 'My Workspace'

interface SessionState {
    status: 'loading' | 'signedOut' | 'signedIn'
    user: User | null
    workspaces: Workspace[]
    activeWorkspaceId: string | null
}

export const useSession = create<SessionState>(() => ({
    status: 'loading',
    user: null,
    workspaces: [],
    activeWorkspaceId: null,
}))

/** Keeps the remembered workspace when it still exists, else falls back to the first. */
function pickActive(workspaces: Workspace[], preferredId: string | null): string | null {
    const preferred = workspaces.find((workspace) => workspace.id === preferredId)

    return (preferred ?? workspaces[0])?.id ?? null
}

export function selectWorkspace(id: string): void {
    localStorage.setItem(ACTIVE_WORKSPACE_KEY, id)
    useSession.setState({ activeWorkspaceId: id })
}

/** Loads the session from the server. Also call it after membership may have changed. */
export async function loadSession(): Promise<void> {
    const { user, workspaces } = await api.me()
    const preferredId =
        useSession.getState().activeWorkspaceId ?? localStorage.getItem(ACTIVE_WORKSPACE_KEY)

    useSession.setState({
        status: user ? 'signedIn' : 'signedOut',
        user,
        workspaces,
        activeWorkspaceId: pickActive(workspaces, preferredId),
    })
}

export async function signIn(email: string, password: string): Promise<void> {
    await api.login(email, password)
    await loadSession()
}

export async function signUp(email: string, name: string, password: string): Promise<void> {
    await api.register(email, name, password)
    await api.createWorkspace(FIRST_WORKSPACE_NAME)
    await loadSession()
}

export async function signOut(): Promise<void> {
    await api.logout()
    useSession.setState({
        status: 'signedOut',
        user: null,
        workspaces: [],
        activeWorkspaceId: null,
    })
}

export async function createWorkspace(name: string): Promise<void> {
    const workspace = await api.createWorkspace(name)

    await loadSession()
    selectWorkspace(workspace.id)
}

export async function renameWorkspace(id: string, name: string): Promise<void> {
    await api.renameWorkspace(id, name)
    await loadSession()
}

export async function deleteWorkspace(id: string): Promise<void> {
    await api.deleteWorkspace(id)
    await loadSession()
}

export async function leaveWorkspace(id: string): Promise<void> {
    const { user } = useSession.getState()

    if (!user) {
        return
    }

    await api.removeMember(id, user.id)
    await loadSession()
}

export async function acceptInvite(token: string): Promise<void> {
    const workspace = await api.acceptInvite(token)

    await loadSession()
    selectWorkspace(workspace.id)
}

export function useActiveWorkspace(): Workspace | undefined {
    return useSession((state) =>
        state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId),
    )
}

/** The open workspace's id. Only for components rendered inside the workbench. */
export function useWorkspaceId(): string {
    return useSession((state) => state.activeWorkspaceId) ?? ''
}
