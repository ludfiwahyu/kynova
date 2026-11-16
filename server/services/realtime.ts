import { randomUUID } from 'node:crypto'
import type { IncomingMessage, Server } from 'node:http'

import { WebSocket, WebSocketServer } from 'ws'

import { currentTarget, runIn, type Target } from '#server/database/context.ts'
import { requestTarget, whenTargetOpens } from '#server/database/targets.ts'
import { isAllowedHost, isSameOrigin } from '#server/http/router.ts'
import type {
    ClientChange,
    ClientMessage,
    Presence,
    Role,
    ServerMessage,
    User,
} from '#shared/types.ts'
import { MB } from '#shared/units.ts'

import { currentUser } from './auth.ts'
import { applyChange, ChangeRejected, loadDoc, loadSnapshot, loadVersions } from './docs.ts'
import { isEntity, isId } from './validation.ts'
import { getRole, listMembers } from './workspaces.ts'

const MAX_MESSAGE_BYTES = 2 * MB
const CLOSE_ACCESS_REVOKED = 4403

/** This server, among the Kynova servers sharing a PostgreSQL database. */
const SERVER_ID = randomUUID()
/** How often each server repeats who is here, and how long others trust it without hearing again. */
const PRESENCE_HEARTBEAT_MS = 20_000
const PRESENCE_EXPIRY_MS = 60_000
/** pg_notify takes up to 8000 bytes, so changed documents are announced in batches. */
const NOTIFY_BATCH = 100

interface Client {
    id: string
    socket: WebSocket
    user: User
    role: Role
    /** The request this client has open, shown to collaborators. */
    itemId: string | null
}

interface Room {
    target: Target
    workspaceId: string
    clients: Set<Client>
    /** People connected to other servers on the same database, by server, with when that was last heard. */
    remote: Map<
        string,
        {
            users: Presence[]
            at: number
        }
    >
    /**
     * The workspace's work, one task at a time: changes, and snapshots for people
     * joining. Each task sees the results of the ones before it, so every client
     * receives changes in the order the database stored them.
     */
    queue: Promise<void>
}

/** Open workspaces, by database and workspace id: two databases can have the same workspace id. */
const rooms = new Map<string, Room>()
const roomKey = (targetId: string, workspaceId: string) => `${targetId}\u0000${workspaceId}`

function send(client: Client, message: ServerMessage): void {
    if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(JSON.stringify(message))
    }
}

/**
 * Runs `task` after the room's earlier tasks, against the room's database.
 * A failing task is reported to `client`, when there is one.
 */
function enqueue(room: Room, client: Client | null, task: () => Promise<void>): void {
    room.queue = room.queue
        .then(() => runIn(room.target, task))
        .catch((error) => {
            console.error(error)

            if (client) {
                send(client, {
                    type: 'error',
                    message: 'Something went wrong on the server.',
                })
            }
        })
}

async function sendSnapshot(room: Room, client: Client): Promise<void> {
    const [snapshot, members] = await Promise.all([
        loadSnapshot(room.workspaceId),
        listMembers(room.workspaceId),
    ])

    send(client, {
        type: 'snapshot',
        snapshot,
        role: client.role,
        members,
    })
}

// ── Other servers on the same database ───────────────────────────────────

/** What servers sharing a PostgreSQL database tell each other. Kept small: NOTIFY carries 8000 bytes. */
type Notice =
    | {
          o: string
          w: string
          k: 'docs'
          c: [entity: string, id: string][]
      }
    | {
          o: string
          w: string
          k: 'members'
      }
    | {
          o: string
          w: string
          k: 'presence'
          u: Presence[]
      }

function announce(target: Target, notice: Notice): void {
    target.db
        .notify(JSON.stringify(notice))
        .catch((error) => console.error(`Could not tell other servers: ${error.message}`))
}

function localPresence(room: Room): Presence[] {
    return [...room.clients].map(({ id, user, itemId }) => ({
        connectionId: id,
        userId: user.id,
        name: user.name,
        color: user.color,
        itemId,
    }))
}

function broadcastPresence(room: Room, { announceToOthers = true } = {}): void {
    const now = Date.now()
    const remote = [...room.remote.values()]
        .filter(({ at }) => now - at < PRESENCE_EXPIRY_MS)
        .flatMap(({ users }) => users)
    const users = [...localPresence(room), ...remote]

    for (const client of room.clients) {
        send(client, {
            type: 'presence',
            users,
        })
    }

    if (announceToOthers) {
        announce(room.target, {
            o: SERVER_ID,
            w: room.workspaceId,
            k: 'presence',
            u: localPresence(room).slice(0, 40),
        })
    }
}

/** Another server stored changes: its documents are read back and passed to people here. */
async function receiveDocs(room: Room, changed: [string, string][]): Promise<void> {
    for (const [entity, id] of changed) {
        if (!isEntity(entity)) {
            continue
        }

        const doc = await loadDoc(room.workspaceId, entity, id)
        const message: ServerMessage = doc
            ? ({
                  type: 'put',
                  entity,
                  doc,
              } as ServerMessage)
            : {
                  type: 'delete',
                  entity,
                  id,
              }

        for (const client of room.clients) {
            send(client, message)
        }
    }
}

function receiveNotice(target: Target, payload: string): void {
    let notice: Notice

    try {
        notice = JSON.parse(payload)
    } catch {
        return
    }

    if (notice.o === SERVER_ID) {
        return
    }

    const room = rooms.get(roomKey(target.id, notice.w))

    if (!room) {
        return
    }

    if (notice.k === 'docs') {
        enqueue(room, null, () => receiveDocs(room, notice.c))
    } else if (notice.k === 'members') {
        enqueue(room, null, () => syncRoomMembers(room))
    } else if (notice.k === 'presence') {
        if (notice.u.length) {
            room.remote.set(notice.o, {
                users: notice.u,
                at: Date.now(),
            })
        } else {
            room.remote.delete(notice.o)
        }

        broadcastPresence(room, { announceToOthers: false })
    }
}

whenTargetOpens((target) => target.db.onNotify((payload) => receiveNotice(target, payload)))

// Other servers forget people they stop hearing about, so presence is repeated while people are here.
setInterval(() => {
    for (const room of rooms.values()) {
        if (room.target.db.engine === 'postgres' && room.clients.size) {
            broadcastPresence(room)
        }
    }
}, PRESENCE_HEARTBEAT_MS).unref()

// ── People here ─────────────────────────────────────────────────────────

/** The sender gets the stored result as an ack; everyone else gets it as changes. */
async function handleChange(
    room: Room,
    sender: Client,
    change: ClientChange,
    seq: number,
): Promise<void> {
    try {
        const results = await applyChange(room.workspaceId, sender.user, sender.role, change)

        send(sender, {
            type: 'ack',
            seq,
            changes: results,
        })

        for (const client of room.clients) {
            if (client !== sender) {
                results.forEach((result) => send(client, result))
            }
        }

        const changed = results.map((result): [string, string] => [
            result.entity,
            result.type === 'put' ? result.doc.id : result.id,
        ])

        for (let start = 0; start < changed.length; start += NOTIFY_BATCH) {
            announce(room.target, {
                o: SERVER_ID,
                w: room.workspaceId,
                k: 'docs',
                c: changed.slice(start, start + NOTIFY_BATCH),
            })
        }
    } catch (error) {
        if (!(error instanceof ChangeRejected)) {
            throw error
        }

        // The sender applied the change optimistically; the snapshot puts it back in sync.
        send(sender, {
            type: 'error',
            message: error.message,
        })
        await sendSnapshot(room, sender)
    }
}

function handleMessage(room: Room, client: Client, raw: string): void {
    let message: ClientMessage

    try {
        message = JSON.parse(raw)
    } catch {
        return send(client, {
            type: 'error',
            message: 'Message was not valid JSON.',
        })
    }

    if (message.type === 'focus') {
        client.itemId = isId(message.itemId) ? message.itemId : null
        broadcastPresence(room)
    } else if (message.type === 'versions') {
        const { itemId } = message

        if (isId(itemId)) {
            enqueue(room, client, async () =>
                send(client, {
                    type: 'versions',
                    itemId,
                    versions: await loadVersions(room.workspaceId, itemId),
                }),
            )
        }
    } else if (
        message.type === 'put' ||
        message.type === 'delete' ||
        message.type === 'patch' ||
        message.type === 'save' ||
        message.type === 'restore'
    ) {
        const { seq, ...change } = message

        enqueue(room, client, () =>
            handleChange(room, client, change, Number.isSafeInteger(seq) ? seq : 0),
        )
    }
}

function join(
    target: Target,
    workspaceId: string,
    socket: WebSocket,
    user: User,
    role: Role,
): void {
    const client: Client = {
        id: randomUUID(),
        socket,
        user,
        role,
        itemId: null,
    }
    const key = roomKey(target.id, workspaceId)
    const room: Room = rooms.get(key) ?? {
        target,
        workspaceId,
        clients: new Set(),
        remote: new Map(),
        queue: Promise.resolve(),
    }

    rooms.set(key, room)
    room.clients.add(client)

    // Presence follows the snapshot, so a joining client always has the workspace before the people in it.
    enqueue(room, client, async () => {
        await sendSnapshot(room, client)
        broadcastPresence(room)
    })

    socket.on('message', (data) => handleMessage(room, client, data.toString()))

    socket.on('close', () => {
        room.clients.delete(client)

        if (room.clients.size === 0 && rooms.get(key) === room) {
            rooms.delete(key)
        }

        broadcastPresence(room)
    })
}

/** Updates roles in a room, and disconnects people who lost access. */
async function syncRoomMembers(room: Room): Promise<void> {
    const members = await listMembers(room.workspaceId)

    for (const client of room.clients) {
        const member = members.find(({ userId }) => userId === client.user.id)

        if (!member) {
            client.socket.close(CLOSE_ACCESS_REVOKED, 'Access revoked')
            continue
        }

        client.role = member.role
        send(client, {
            type: 'members',
            role: member.role,
            members,
        })
    }
}

/** Call after membership changes, from a request: here and on every other server on this database. */
export async function syncMembers(workspaceId: string): Promise<void> {
    const target = currentTarget()
    const room = rooms.get(roomKey(target.id, workspaceId))

    if (room) {
        await syncRoomMembers(room)
    }

    announce(target, {
        o: SERVER_ID,
        w: workspaceId,
        k: 'members',
    })
}

/** Authenticates a WebSocket upgrade. Returns what `join` needs, or null to refuse. */
async function authorize(req: IncomingMessage): Promise<{
    target: Target
    workspaceId: string
    user: User
    role: Role
} | null> {
    const url = new URL(req.url ?? '/', 'http://localhost')
    const workspaceId = url.searchParams.get('workspace')

    if (url.pathname !== '/ws' || !workspaceId || !isAllowedHost(req) || !isSameOrigin(req)) {
        return null
    }

    let target: Target

    try {
        target = await requestTarget(req)
    } catch {
        return null
    }

    return runIn(target, async () => {
        const user = await currentUser(req)
        const role = user && (await getRole(workspaceId, user.id))

        return user && role
            ? {
                  target,
                  workspaceId,
                  user,
                  role,
              }
            : null
    })
}

export function attachRealtime(server: Server): void {
    const sockets = new WebSocketServer({
        noServer: true,
        maxPayload: MAX_MESSAGE_BYTES,
    })

    server.on('upgrade', (req, socket, head) => {
        authorize(req).then(
            (access) => {
                if (!access) {
                    socket.end('HTTP/1.1 403 Forbidden\r\n\r\n')

                    return
                }

                sockets.handleUpgrade(req, socket, head, (webSocket) => {
                    join(access.target, access.workspaceId, webSocket, access.user, access.role)
                })
            },
            (error) => {
                console.error(error)
                socket.end('HTTP/1.1 500 Internal Server Error\r\n\r\n')
            },
        )
    })
}
