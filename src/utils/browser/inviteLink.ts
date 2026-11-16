/** Invite links look like `https://host/#/invite/<token>`. */
const INVITE_HASH = /^#\/invite\/([\w-]+)$/

export function inviteUrl(token: string): string {
    return `${location.origin}/#/invite/${token}`
}

export function inviteTokenFromLocation(): string | null {
    return location.hash.match(INVITE_HASH)?.[1] ?? null
}

export function clearInviteFromLocation(): void {
    history.replaceState(null, '', location.pathname)
}

// ── Links to items: `https://host/#/w/<workspace>/<kind>/<id>` ──────────

type LinkKind = 'item' | 'environment' | 'workspace'

const ITEM_HASH = /^#\/w\/([\w-]+)\/(item|environment|workspace)\/([\w-]+)$/

export interface ItemLink {
    workspaceId: string
    kind: LinkKind
    id: string
}

export function itemUrl(workspaceId: string, kind: LinkKind, id: string): string {
    return `${location.origin}/#/w/${workspaceId}/${kind}/${id}`
}

export function itemLinkFromLocation(): ItemLink | null {
    const match = location.hash.match(ITEM_HASH)

    return match
        ? {
              workspaceId: match[1],
              kind: match[2] as LinkKind,
              id: match[3],
          }
        : null
}
