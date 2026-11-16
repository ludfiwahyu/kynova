/** Domain model shared by the client and the server. Types only, no runtime code. */

// ── Accounts and workspaces ──────────────────────────────────────────────

export type Role = 'owner' | 'editor' | 'viewer'

/** Roles an owner can hand out. Every workspace has exactly one owner: its creator. */
export type AssignableRole = Exclude<Role, 'owner'>

export interface User {
    id: string
    email: string
    name: string
    color: string
}

export interface Workspace {
    id: string
    name: string
    role: Role
}

export interface Member {
    userId: string
    name: string
    email: string
    color: string
    role: Role
}

export interface InvitePreview {
    workspaceName: string
    role: AssignableRole
}

// ── Requests ─────────────────────────────────────────────────────────────

export interface KeyValue {
    id: string
    key: string
    value: string
    enabled: boolean
    /** Absent and empty are different: imported files keep the difference. */
    description?: string
    /** The variable type ("string", "secret"…), kept only for round trips. */
    type?: string
}

export type StandardMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

/** A standard method, or any other method token, such as PROPFIND (see `shared/methods.ts`). */
export type HttpMethod = StandardMethod | (string & {})

/**
 * Auth the server signs when it sends the request: it needs the final request,
 * the clock, or a challenge from the API (Digest, NTLM). Names follow the collection format.
 */
export type SignedAuthType =
    'digest' | 'hawk' | 'jwt' | 'oauth1' | 'edgegrid' | 'asap' | 'awsv4' | 'ntlm'

/** A row of an OAuth 2.0 extra-parameter table, as the collection format stores it. */
export interface AuthParam {
    key: string
    value: string
    enabled?: boolean
    /** Where a token-request parameter goes: `request_body`, `request_header` or `request_url`. */
    send_as?: string
}

export type AuthValue = string | boolean | number | AuthParam[]

/** Auth settings under the collection format's key names, so collections round-trip unchanged. */
export type AuthValues = Record<string, AuthValue>

export type Auth =
    | { type: 'none' }
    | {
          type: 'bearer'
          token: string
      }
    | {
          type: 'basic'
          username: string
          password: string
      }
    | {
          type: 'apikey'
          key: string
          value: string
          addTo: 'header' | 'query'
      }
    | {
          type: SignedAuthType | 'oauth2'
          values: AuthValues
      }

export type RawLanguage = 'json' | 'text' | 'xml' | 'html' | 'javascript'

export type Body =
    | { type: 'none' }
    | {
          type: 'raw'
          language: RawLanguage
          text: string
      }
    | {
          type: 'urlencoded'
          fields: KeyValue[]
      }

export interface HttpRequest {
    method: HttpMethod
    url: string
    params: KeyValue[]
    headers: KeyValue[]
    auth: Auth
    body: Body
    /** Values for `:name` segments in the URL. Absent in requests saved before path variables existed. */
    pathVariables?: KeyValue[]
}

/**
 * Script text kept with a collection, folder or request, in two
 * phases. It is stored, edited, imported and exported; Kynova does not run it.
 * An absent phase and an empty one are different, so files round-trip unchanged.
 */
export interface Scripts {
    preRequest?: string
    test?: string
}

// ── Synced workspace documents ───────────────────────────────────────────

/** The colours a collection or environment can be tagged with; each maps to a theme colour. */
export const TAG_COLORS = [
    'red',
    'orange',
    'yellow',
    'green',
    'teal',
    'blue',
    'indigo',
    'purple',
    'pink',
    'gray',
] as const

export type NamedTagColor = (typeof TAG_COLORS)[number]

/** One of the named colours, or any colour as `#rrggbb`. */
export type TagColor = NamedTagColor | `#${string}`

export const HEX_COLOR = /^#[0-9a-f]{6}$/i

interface ItemBase {
    id: string
    /** `null` for collections, which sit at the root of the tree. */
    parentId: string | null
    name: string
    /** Position among siblings, ascending. */
    order: number
    /** Markdown documentation. Absent and empty are different (see `KeyValue.description`). */
    description?: string
    scripts?: Scripts
    /** Colour tag shown in the sidebar. Absent means none. */
    color?: TagColor
    /** Who last saved a request and when (ms). Set by the server on Save, never by a client. */
    savedBy?: string
    savedAt?: number
}

export interface CollectionItem extends ItemBase {
    kind: 'collection'
    parentId: null
    /** Collection variables: used for `{{name}}` when the active environment does not set the name. */
    variables?: KeyValue[]
    /** The collection's id in the file it was imported from, kept so exporting it again keeps the id. */
    sourceId?: string
    /** The key order of the file it was imported from, so exporting it again changes no line. */
    keyOrder?: KeyOrder
}

/** Key order of each kind of object in a collection file, by object kind. */
export type KeyOrder = Partial<
    Record<'collection' | 'info' | 'folder' | 'item' | 'request' | 'url', string[]>
>

export interface FolderItem extends ItemBase {
    kind: 'folder'
}

export interface HttpItem extends ItemBase {
    kind: 'http'
    request: HttpRequest
}

export interface WebSocketItem extends ItemBase {
    kind: 'websocket'
    url: string
}

export type Item = CollectionItem | FolderItem | HttpItem | WebSocketItem
export type ItemKind = Item['kind']

export interface Environment {
    id: string
    name: string
    variables: KeyValue[]
    /** Colour tag shown in the sidebar. Absent means none. */
    color?: TagColor
}

/**
 * A deleted collection, folder or request, kept so it can be restored: the item, everything
 * that was inside it, and their comments, with who deleted it and when.
 */
export interface ArchiveEntry {
    id: string
    /** The deleted item; `items[0]` is it, the rest were inside it. */
    itemId: string
    name: string
    kind: ItemKind
    /** Where it was, and the collection it was in (null for a collection). */
    parentId: string | null
    collectionId: string | null
    deletedBy: string
    deletedAt: number
    items: Item[]
    comments: Comment[]
}

export interface Comment {
    id: string
    itemId: string
    userId: string
    authorName: string
    text: string
    createdAt: number
}

/** The document kinds a workspace syncs, mapped to their shape. */
/** Sidebar panels a workspace can switch off. Collections are always shown. */
export type OptionalPanel = 'environments' | 'history'

/**
 * Settings that apply to everyone in a workspace. One document, id `workspace`,
 * changed only by the owner. Absent fields mean the default.
 */
export interface WorkspaceSettings {
    id: 'workspace'
    /** `false` hides the panel from everyone's sidebar. */
    panels?: Partial<Record<OptionalPanel, boolean>>
    /** A hex colour, such as `#3b72e1`, for buttons and highlights. */
    accentColor?: string
    /** Light or dark for everyone; absent lets each person choose. */
    theme?: 'light' | 'dark'
}

export const WORKSPACE_SETTINGS_ID = 'workspace'

export interface EntityMap {
    items: Item
    environments: Environment
    comments: Comment
    settings: WorkspaceSettings
    archive: ArchiveEntry
}

export type Entity = keyof EntityMap

export interface Snapshot {
    items: Item[]
    environments: Environment[]
    comments: Comment[]
    settings: WorkspaceSettings[]
    /** Absent from servers older than the Archive. */
    archive?: ArchiveEntry[]
}

// ── Realtime protocol ────────────────────────────────────────────────────
//
// A client sends each change with a sequence number. The server applies it,
// replies to the sender with an `ack` holding the stored result, and sends that
// result to everyone else. The sender ignores others' changes to a document
// while its own are unacknowledged, then takes the server's version from the
// ack, so every client ends on the same state.

export type PutMessage = {
    [E in Entity]: {
        type: 'put'
        entity: E
        doc: EntityMap[E]
    }
}[Entity]

export interface DeleteMessage {
    type: 'delete'
    entity: Entity
    id: string
}

/**
 * Changes some fields of an HTTP request. The server merges them into the
 * stored request, so two people editing different fields both keep their edit.
 */
export interface PatchRequestMessage {
    type: 'patch'
    id: string
    changes: Partial<HttpRequest>
}

/**
 * Saves a request's draft: its request (or WebSocket URL) and scripts replace the stored ones.
 * The last Save wins. The server keeps the stored name and place, and stamps who saved it and when.
 */
export interface SaveRequestMessage {
    type: 'save'
    doc: HttpItem | WebSocketItem
}

/** Puts an archived item back: in its old place, or its collection when that place is gone. */
export interface RestoreMessage {
    type: 'restore'
    id: string
}

/** How many saved versions of a request are kept; older ones are deleted. */
export const MAX_VERSIONS = 10

/** A saved version of a request: what a Save stored, who saved it and when. */
export interface RequestVersion {
    id: string
    itemId: string
    kind: 'http' | 'websocket'
    savedBy: string
    savedAt: number
    request?: HttpRequest
    url?: string
    scripts?: Scripts
}

/** A stored change, as the server sends it out. */
export type ChangeMessage = PutMessage | DeleteMessage

/** A change as a client asks for it. */
export type ClientChange = ChangeMessage | PatchRequestMessage | SaveRequestMessage | RestoreMessage

/** Tells collaborators which request this client is looking at. */
export interface FocusMessage {
    type: 'focus'
    itemId: string | null
}

/** Asks for a request's saved versions, newest first. */
export interface VersionsRequest {
    type: 'versions'
    itemId: string
}

export type ClientMessage = (ClientChange & { seq: number }) | FocusMessage | VersionsRequest

export interface Presence {
    connectionId: string
    userId: string
    name: string
    color: string
    itemId: string | null
}

export type ServerMessage =
    | ChangeMessage
    | {
          type: 'ack'
          seq: number
          changes: ChangeMessage[]
      }
    | {
          type: 'snapshot'
          snapshot: Snapshot
          role: Role
          members: Member[]
      }
    | {
          type: 'members'
          role: Role
          members: Member[]
      }
    | {
          type: 'presence'
          users: Presence[]
      }
    | {
          type: 'error'
          message: string
      }
    | {
          type: 'versions'
          itemId: string
          versions: RequestVersion[]
      }

// ── Request proxy ────────────────────────────────────────────────────────

/** A fully resolved request: variables substituted, auth and params applied. */
export interface SendRequest {
    method: HttpMethod
    url: string
    headers: [name: string, value: string][]
    body: string | null
    /** From the sender's Settings; the server caps each at its own limit. */
    options?: SendOptions
    /** Auth the server signs as it sends, with `{{variables}}` already filled in. */
    auth?: SendAuth
}

export interface SendAuth {
    type: SignedAuthType
    values: AuthValues
}

export interface SendOptions {
    /** 0 or absent uses the server's default. */
    timeoutMs?: number
    /** 0 or absent uses the server's limit. */
    maxResponseBytes?: number
    /** Absent means follow. Servers that block private addresses never follow. */
    followRedirects?: boolean
}

export interface SendResponse {
    status: number
    statusText: string
    headers: [name: string, value: string][]
    body: string
    /** True when `body` is base64 because the content is not text. */
    bodyIsBase64: boolean
    /** True when the body was cut off at the size limit. */
    truncated: boolean
    /** The size limit that applied, in bytes. */
    limitBytes: number
    sizeBytes: number
    timeMs: number
}
