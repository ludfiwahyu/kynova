import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { newId, type TokenResponse } from '@/utils'
import type { Auth, HttpItem } from '#shared/types.ts'

export interface OAuthToken extends TokenResponse {
    id: string
    name: string
    createdAt: number
}

interface TokenState {
    tokens: OAuthToken[]
    /** The token each request uses, by request id. */
    chosen: Record<string, string>
}

export const useOAuthTokens = create<TokenState>()(
    persist(
        (): TokenState => ({
            tokens: [],
            chosen: {},
        }),
        { name: 'kynova.oauth2Tokens' },
    ),
)

export function addToken(itemId: string, name: string, token: TokenResponse): OAuthToken {
    const saved: OAuthToken = {
        ...token,
        id: newId(),
        name: name || 'Token',
        createdAt: Date.now(),
    }

    useOAuthTokens.setState(({ tokens, chosen }) => ({
        tokens: [saved, ...tokens],
        chosen: {
            ...chosen,
            [itemId]: saved.id,
        },
    }))

    return saved
}

export function replaceToken(id: string, token: TokenResponse): void {
    useOAuthTokens.setState(({ tokens }) => ({
        tokens: tokens.map((saved) =>
            saved.id === id
                ? {
                      ...saved,
                      ...token,
                      refreshToken: token.refreshToken ?? saved.refreshToken,
                  }
                : saved,
        ),
    }))
}

export function chooseToken(itemId: string, tokenId: string | null): void {
    useOAuthTokens.setState(({ chosen }) => {
        const next = { ...chosen }

        if (tokenId) {
            next[itemId] = tokenId
        } else {
            delete next[itemId]
        }

        return { chosen: next }
    })
}

export function deleteToken(id: string): void {
    useOAuthTokens.setState(({ tokens, chosen }) => ({
        tokens: tokens.filter((token) => token.id !== id),
        chosen: Object.fromEntries(Object.entries(chosen).filter(([, tokenId]) => tokenId !== id)),
    }))
}

export function chosenToken(itemId: string): OAuthToken | undefined {
    const { tokens, chosen } = useOAuthTokens.getState()

    return tokens.find((token) => token.id === chosen[itemId])
}

/** The request as it should be sent: with this person's chosen token, which wins over a shared one. */
export function withChosenToken(item: HttpItem): HttpItem {
    const { auth } = item.request
    const token = auth.type === 'oauth2' ? chosenToken(item.id) : undefined

    if (auth.type !== 'oauth2' || !token) {
        return item
    }

    const withToken: Auth = {
        ...auth,
        values: {
            ...auth.values,
            accessToken: token.accessToken,
        },
    }

    return {
        ...item,
        request: {
            ...item.request,
            auth: withToken,
        },
    }
}
