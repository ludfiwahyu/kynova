/** The open workspace: its synced documents, the people in it, and the connection state. */
import { create } from 'zustand'

import type {
    ArchiveEntry,
    ChangeMessage,
    Comment,
    Environment,
    HttpRequest,
    Item,
    Member,
    Presence,
    Role,
    ServerMessage,
    WorkspaceSettings,
} from '#shared/types.ts'

export type Connection = 'connecting' | 'connected' | 'offline'

interface WorkspaceState {
    connection: Connection
    role: Role
    members: Member[]
    presence: Presence[]
    items: Record<string, Item>
    environments: Record<string, Environment>
    comments: Record<string, Comment>
    archive: Record<string, ArchiveEntry>
    /** Holds at most one document, `workspace`; read it with `useWorkspaceSettings`. */
    settings: Record<string, WorkspaceSettings>
    /** The latest problem reported by the server, shown until dismissed. */
    notice: string | null
}

const EMPTY: WorkspaceState = {
    connection: 'connecting',
    role: 'viewer',
    members: [],
    presence: [],
    items: {},
    environments: {},
    comments: {},
    archive: {},
    settings: {},
    notice: null,
}

export const useWorkspace = create<WorkspaceState>(() => EMPTY)

function byId<T extends { id: string }>(docs: T[]): Record<string, T> {
    return Object.fromEntries(docs.map((doc) => [doc.id, doc]))
}

export function resetWorkspace(): void {
    useWorkspace.setState(EMPTY)
}

export function setConnection(connection: Connection): void {
    useWorkspace.setState({ connection })
}

export function dismissNotice(): void {
    useWorkspace.setState({ notice: null })
}

/** Applies one put or delete to the local copy of the workspace. */
export function applyChange(change: ChangeMessage): void {
    useWorkspace.setState((state) => {
        const docs = { ...state[change.entity] }

        if (change.type === 'put') {
            docs[change.doc.id] = change.doc
        } else {
            delete docs[change.id]
        }

        return { [change.entity]: docs }
    })
}

/** Merges changed fields into an HTTP request, as the server will. */
export function applyRequestPatch(itemId: string, changes: Partial<HttpRequest>): void {
    useWorkspace.setState((state) => {
        const item = state.items[itemId]

        if (item?.kind !== 'http') {
            return {}
        }

        return {
            items: {
                ...state.items,
                [itemId]: {
                    ...item,
                    request: {
                        ...item.request,
                        ...changes,
                    },
                },
            },
        }
    })
}

/** Applies a message from the server. Acks are handled by the sync module before this. */
export function applyServerMessage(
    message: Exclude<ServerMessage, { type: 'ack' | 'versions' }>,
): void {
    switch (message.type) {
        case 'snapshot':
            useWorkspace.setState({
                connection: 'connected',
                role: message.role,
                members: message.members,
                items: byId(message.snapshot.items),
                environments: byId(message.snapshot.environments),
                comments: byId(message.snapshot.comments),
                archive: byId(message.snapshot.archive ?? []),
                // Older servers send no settings.
                settings: byId(message.snapshot.settings ?? []),
            })
            break
        case 'members':
            useWorkspace.setState({
                role: message.role,
                members: message.members,
            })
            break
        case 'presence':
            useWorkspace.setState({ presence: message.users })
            break
        case 'error':
            useWorkspace.setState({ notice: message.message })
            break
        case 'put':
        case 'delete':
            applyChange(message)
            break
    }
}

/** Editing needs an editor role and a live connection: offline edits would be lost. */
export function useCanEdit(): boolean {
    return useWorkspace((state) => state.connection === 'connected' && state.role !== 'viewer')
}

const DEFAULT_SETTINGS: WorkspaceSettings = { id: 'workspace' }

/** The open workspace's shared settings; defaults when none were saved. */
export function useWorkspaceSettings(): WorkspaceSettings {
    return useWorkspace((state) => state.settings.workspace ?? DEFAULT_SETTINGS)
}
