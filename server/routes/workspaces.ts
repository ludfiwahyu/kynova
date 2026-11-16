import { HttpError, readJson, route, stringField } from '#server/http/router.ts'
import { requireUser } from '#server/services/auth.ts'
import { syncMembers } from '#server/services/realtime.ts'
import {
    acceptInvite,
    createInvite,
    createWorkspace,
    deleteWorkspace,
    isAssignableRole,
    previewInvite,
    removeMember,
    renameWorkspace,
    requireRole,
    setMemberRole,
} from '#server/services/workspaces.ts'
import { STATUS } from '#shared/http.ts'
import { MAX_WORKSPACE_NAME_LENGTH } from '#shared/limits.ts'

function assignableRole(body: Record<string, unknown>) {
    if (!isAssignableRole(body.role)) {
        throw new HttpError(STATUS.badRequest, 'Role must be "editor" or "viewer".')
    }

    return body.role
}

export const workspaceRoutes = [
    route('POST', '/api/workspaces', async ({ req }) => {
        const user = await requireUser(req)
        const body = await readJson(req)

        return createWorkspace(user.id, stringField(body, 'name', MAX_WORKSPACE_NAME_LENGTH))
    }),

    route('PATCH', '/api/workspaces/:id', async ({ req, params }) => {
        await requireRole(params.id, (await requireUser(req)).id, 'owner')
        const body = await readJson(req)

        await renameWorkspace(params.id, stringField(body, 'name', MAX_WORKSPACE_NAME_LENGTH))
    }),

    route('DELETE', '/api/workspaces/:id', async ({ req, params }) => {
        await requireRole(params.id, (await requireUser(req)).id, 'owner')
        await deleteWorkspace(params.id)
        await syncMembers(params.id) // Nobody is a member any more, so this disconnects everyone.
    }),

    // ── Members ────────────────────────────────────────────────────────────

    route('PATCH', '/api/workspaces/:id/members/:userId', async ({ req, params }) => {
        await requireRole(params.id, (await requireUser(req)).id, 'owner')
        await setMemberRole(params.id, params.userId, assignableRole(await readJson(req)))
        await syncMembers(params.id)
    }),

    /** Owners remove anyone but themselves; other members can remove only themselves (leave). */
    route('DELETE', '/api/workspaces/:id/members/:userId', async ({ req, params }) => {
        const user = await requireUser(req)
        const isLeaving = params.userId === user.id

        await requireRole(params.id, user.id, isLeaving ? 'viewer' : 'owner')
        await removeMember(params.id, params.userId)
        await syncMembers(params.id)
    }),

    // ── Invites ────────────────────────────────────────────────────────────

    route('POST', '/api/workspaces/:id/invites', async ({ req, params }) => {
        await requireRole(params.id, (await requireUser(req)).id, 'owner')

        return { token: await createInvite(params.id, assignableRole(await readJson(req))) }
    }),

    route('GET', '/api/invites/:token', async ({ req, params }) => {
        await requireUser(req)

        return previewInvite(params.token)
    }),

    route('POST', '/api/invites/:token/accept', async ({ req, params }) => {
        const workspace = await acceptInvite(params.token, (await requireUser(req)).id)

        await syncMembers(workspace.id)

        return workspace
    }),
]
