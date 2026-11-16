import { API_SERVICES } from '@/constants'
import { HEADER, MIME } from '#shared/http.ts'
import { STATUS } from '#shared/http.ts'
import type {
    AssignableRole,
    InvitePreview,
    SendRequest,
    SendResponse,
    User,
    Workspace,
} from '#shared/types.ts'

/** A failed API call. The message comes from the server and is fit to show. */
export class ApiError extends Error {
    status: number

    constructor(status: number, message: string) {
        super(message)
        this.status = status
    }
}

/** Calls one of the server's addresses (`API_SERVICES`). */
async function call<T = void>(method: string, path: string, body?: unknown): Promise<T> {
    let response: Response

    try {
        response = await fetch(path, {
            method,
            headers: body === undefined ? undefined : { [HEADER.contentType]: MIME.json },
            body: body === undefined ? undefined : JSON.stringify(body),
        })
    } catch {
        throw new ApiError(0, 'Cannot reach the Kynova server. Check that it is running.')
    }

    if (response.status === 204) {
        return undefined as T
    }

    const data = await response
        .json()
        .catch(() => ({ error: 'The server sent an unreadable reply.' }))

    if (!response.ok) {
        throw new ApiError(response.status, data.error)
    }

    return data
}

/** How much of a response body has arrived, and its size when known. */
export interface SendProgress {
    received: number
    total: number | null
}

/**
 * Sends through the server and hears how much of the response has arrived as it does
 * (`/api/send/stream`, one JSON object per line).
 */
async function sendWithProgress(
    request: SendRequest,
    onProgress: (progress: SendProgress) => void,
): Promise<SendResponse> {
    let response: Response

    try {
        response = await fetch(API_SERVICES.sendStream, {
            method: 'POST',
            headers: { [HEADER.contentType]: MIME.json },
            body: JSON.stringify(request),
        })
    } catch {
        throw new ApiError(0, 'Cannot reach the Kynova server. Check that it is running.')
    }

    // Refused before it started (signed out, bad request): an ordinary JSON error.
    if (!response.ok || !response.body) {
        const data = await response
            .json()
            .catch(() => ({ error: 'The server sent an unreadable reply.' }))

        throw new ApiError(response.status, data.error)
    }

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
    let buffer = ''

    for (;;) {
        const { done, value } = await reader.read()

        if (value) {
            buffer += value
        }

        let newline: number

        while ((newline = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, newline).trim()

            buffer = buffer.slice(newline + 1)

            if (!line) {
                continue
            }

            const message = JSON.parse(line)

            if (message.progress) {
                onProgress(message.progress)
            }

            if (message.response) {
                return message.response
            }

            if (message.error) {
                throw new ApiError(message.error.status, message.error.message)
            }
        }

        if (done) {
            throw new ApiError(STATUS.badGateway, 'The server stopped before the response arrived.')
        }
    }
}

export type DatabaseKind = 'local' | 'postgres' | 'supabase'

/** A database people sign in to, as the server describes it. Never holds the password. */
export interface DatabaseStatus {
    id: string
    kind: DatabaseKind
    label: string
    detail: string
}

export interface DatabaseInput {
    url: string
    ssl: 'verify' | 'require' | 'off'
    ca?: string
}

interface Session {
    user: User | null
    workspaces: Workspace[]
}

export const api = {
    me: () => call<Session>('GET', API_SERVICES.me),
    register: (email: string, name: string, password: string) =>
        call<{ user: User }>('POST', API_SERVICES.register, {
            email,
            name,
            password,
        }),
    login: (email: string, password: string) =>
        call<{ user: User }>('POST', API_SERVICES.login, {
            email,
            password,
        }),
    logout: () => call('POST', API_SERVICES.logout),

    createWorkspace: (name: string) => call<Workspace>('POST', API_SERVICES.workspaces, { name }),
    renameWorkspace: (id: string, name: string) =>
        call('PATCH', API_SERVICES.workspace(id), { name }),
    deleteWorkspace: (id: string) => call('DELETE', API_SERVICES.workspace(id)),

    setMemberRole: (workspaceId: string, userId: string, role: AssignableRole) =>
        call('PATCH', API_SERVICES.member(workspaceId, userId), { role }),
    removeMember: (workspaceId: string, userId: string) =>
        call('DELETE', API_SERVICES.member(workspaceId, userId)),

    createInvite: (workspaceId: string, role: AssignableRole) =>
        call<{ token: string }>('POST', API_SERVICES.invites(workspaceId), { role }),
    previewInvite: (token: string) => call<InvitePreview>('GET', API_SERVICES.invite(token)),
    acceptInvite: (token: string) => call<Workspace>('POST', API_SERVICES.acceptInvite(token)),

    send: (request: SendRequest) => call<SendResponse>('POST', API_SERVICES.send, request),
    sendWithProgress,

    database: () =>
        call<{
            database: DatabaseStatus
            error?: string
        }>('GET', API_SERVICES.database),
    testDatabase: (input: DatabaseInput) =>
        call<{
            kind: DatabaseKind
            label: string
            detail: string
            version: string
        }>('POST', API_SERVICES.testDatabase, input),
    /** Switches this browser to a database, which signs it out. */
    useDatabase: (choice: { local: true } | { id: string } | DatabaseInput) =>
        call<{ database: DatabaseStatus }>('POST', API_SERVICES.useDatabase, choice),
}
