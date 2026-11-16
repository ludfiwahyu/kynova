import { randomBytes, randomUUID } from 'node:crypto'

import { config } from '#server/config.ts'
import { db } from '#server/database/index.ts'
import { HttpError } from '#server/http/router.ts'
import { STATUS } from '#shared/http.ts'
import type { AssignableRole, InvitePreview, Member, Role, Workspace } from '#shared/types.ts'

const ROLE_RANK: Record<Role, number> = {
    viewer: 0,
    editor: 1,
    owner: 2,
}

export function hasRole(role: Role, minimum: Role): boolean {
    return ROLE_RANK[role] >= ROLE_RANK[minimum]
}

export function isAssignableRole(value: unknown): value is AssignableRole {
    return value === 'editor' || value === 'viewer'
}

// ── Workspaces ───────────────────────────────────────────────────────────

export function listWorkspaces(userId: string): Promise<Workspace[]> {
    return db.all<Workspace>(
        `SELECT workspaces.id, workspaces.name, members.role
       FROM members JOIN workspaces ON workspaces.id = members.workspace_id
      WHERE members.user_id = ?
      ORDER BY workspaces.created_at`,
        [userId],
    )
}

export async function createWorkspace(ownerId: string, name: string): Promise<Workspace> {
    const id = randomUUID()

    await db.transaction(async (tx) => {
        await tx.run('INSERT INTO workspaces (id, name, created_at) VALUES (?, ?, ?)', [
            id,
            name,
            Date.now(),
        ])
        await tx.run('INSERT INTO members (workspace_id, user_id, role) VALUES (?, ?, ?)', [
            id,
            ownerId,
            'owner',
        ])
    })

    return {
        id,
        name,
        role: 'owner',
    }
}

export async function renameWorkspace(workspaceId: string, name: string): Promise<void> {
    await db.run('UPDATE workspaces SET name = ? WHERE id = ?', [name, workspaceId])
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
    await db.run('DELETE FROM workspaces WHERE id = ?', [workspaceId])
}

// ── Membership ───────────────────────────────────────────────────────────

export async function getRole(workspaceId: string, userId: string): Promise<Role | null> {
    const row = await db.get<{ role: Role }>(
        'SELECT role FROM members WHERE workspace_id = ? AND user_id = ?',
        [workspaceId, userId],
    )

    return row?.role ?? null
}

/** Returns the user's role, or throws when they lack `minimum`. */
export async function requireRole(
    workspaceId: string,
    userId: string,
    minimum: Role,
): Promise<Role> {
    const role = await getRole(workspaceId, userId)

    // Non-members get the same answer as a missing workspace, so ids cannot be probed.
    if (!role) {
        throw new HttpError(STATUS.notFound, 'Workspace not found.')
    }

    if (!hasRole(role, minimum)) {
        throw new HttpError(STATUS.forbidden, `Only a workspace ${minimum} can do this.`)
    }

    return role
}

export function listMembers(workspaceId: string): Promise<Member[]> {
    return db.all<Member>(
        `SELECT users.id AS "userId", users.name, users.email, users.color, members.role
       FROM members JOIN users ON users.id = members.user_id
      WHERE members.workspace_id = ?
      ORDER BY users.name`,
        [workspaceId],
    )
}

/** The owner's role is fixed, so it can be neither reassigned nor removed. */
async function requireNotOwner(workspaceId: string, userId: string): Promise<void> {
    const role = await getRole(workspaceId, userId)

    if (!role) {
        throw new HttpError(STATUS.notFound, 'Member not found.')
    }

    if (role === 'owner') {
        throw new HttpError(STATUS.badRequest, 'The workspace owner cannot be changed or removed.')
    }
}

export async function setMemberRole(
    workspaceId: string,
    userId: string,
    role: AssignableRole,
): Promise<void> {
    await requireNotOwner(workspaceId, userId)
    await db.run('UPDATE members SET role = ? WHERE workspace_id = ? AND user_id = ?', [
        role,
        workspaceId,
        userId,
    ])
}

export async function removeMember(workspaceId: string, userId: string): Promise<void> {
    await requireNotOwner(workspaceId, userId)
    await db.run('DELETE FROM members WHERE workspace_id = ? AND user_id = ?', [
        workspaceId,
        userId,
    ])
}

// ── Invites ──────────────────────────────────────────────────────────────

interface Invite {
    workspaceId: string
    workspaceName: string
    role: AssignableRole
}

export async function createInvite(workspaceId: string, role: AssignableRole): Promise<string> {
    const token = randomBytes(24).toString('base64url')

    await db.run(
        'INSERT INTO invites (token, workspace_id, role, expires_at) VALUES (?, ?, ?, ?)',
        [token, workspaceId, role, Date.now() + config.inviteTtlMs],
    )

    return token
}

async function findInvite(token: string): Promise<Invite> {
    const invite = await db.get<Invite>(
        `SELECT invites.workspace_id AS "workspaceId", workspaces.name AS "workspaceName", invites.role
       FROM invites JOIN workspaces ON workspaces.id = invites.workspace_id
      WHERE invites.token = ? AND invites.expires_at > ?`,
        [token, Date.now()],
    )

    if (!invite) {
        throw new HttpError(STATUS.notFound, 'This invite link is invalid or has expired.')
    }

    return invite
}

export async function previewInvite(token: string): Promise<InvitePreview> {
    const { workspaceName, role } = await findInvite(token)

    return {
        workspaceName,
        role,
    }
}

/** Adds the user to the invite's workspace. Existing members keep their current role. */
export async function acceptInvite(token: string, userId: string): Promise<Workspace> {
    const invite = await findInvite(token)

    await db.run(
        `INSERT INTO members (workspace_id, user_id, role) VALUES (?, ?, ?)
     ON CONFLICT (workspace_id, user_id) DO NOTHING`,
        [invite.workspaceId, userId, invite.role],
    )
    const role = (await getRole(invite.workspaceId, userId)) ?? invite.role

    return {
        id: invite.workspaceId,
        name: invite.workspaceName,
        role,
    }
}

export async function purgeExpiredInvites(): Promise<void> {
    await db.run('DELETE FROM invites WHERE expires_at <= ?', [Date.now()])
}
