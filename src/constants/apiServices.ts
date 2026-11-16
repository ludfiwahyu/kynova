export const API_SERVICES = {
    me: '/api/me',

    register: '/api/auth/register',
    login: '/api/auth/login',
    logout: '/api/auth/logout',

    workspaces: '/api/workspaces',
    workspace: (workspaceId: string) => `/api/workspaces/${workspaceId}`,
    member: (workspaceId: string, userId: string) =>
        `/api/workspaces/${workspaceId}/members/${userId}`,
    invites: (workspaceId: string) => `/api/workspaces/${workspaceId}/invites`,
    invite: (token: string) => `/api/invites/${token}`,
    acceptInvite: (token: string) => `/api/invites/${token}/accept`,

    send: '/api/send',
    /** The same, answered line by line with how much of the response has arrived. */
    sendStream: '/api/send/stream',

    database: '/api/database',
    testDatabase: '/api/database/test',
    useDatabase: '/api/database/use',

    /** Live sync for one workspace, over a WebSocket. */
    sync: (workspaceId: string) => `/ws?workspace=${workspaceId}`,
} as const
