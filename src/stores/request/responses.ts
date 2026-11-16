/** Sending HTTP requests, and the latest response of each one. Kept in memory only. */
import { create } from 'zustand'

import type { SendProgress } from '@/services'
import { usePreferences } from '@/settings'
import { addHistory } from '@/stores/ui/ui'
import { buildSendRequest, newId, refreshAccessToken, type Variables } from '@/utils'
import { flagValue } from '#shared/auth.ts'
import { HEADER } from '#shared/http.ts'
import type { HttpItem, SendRequest, SendResponse } from '#shared/types.ts'
import { MB } from '#shared/units.ts'

import { sendLogged } from './console'
import { chosenToken, replaceToken, withChosenToken } from './oauthTokens'

export type ResponseState =
    /** `progress` once the response has started to arrive; `startedAt` for the time waited. */
    | {
          status: 'sending'
          startedAt: number
          progress?: SendProgress
      }
    | {
          status: 'done'
          response: SendResponse
      }
    | {
          status: 'failed'
          message: string
      }

/** Response state by item id. */
export const useResponses = create<Record<string, ResponseState>>(() => ({}))

/** Applies the Settings › General request options to a request about to be sent. */
function withPreferences(request: SendRequest): SendRequest {
    const preferences = usePreferences.getState()
    const hasCacheControl = request.headers.some(([name]) => name.toLowerCase() === 'cache-control')

    return {
        ...request,
        headers:
            preferences.sendNoCacheHeader && !hasCacheControl
                ? [...request.headers, [HEADER.cacheControl, 'no-cache']]
                : request.headers,
        options: {
            timeoutMs: preferences.requestTimeoutMs,
            maxResponseBytes: preferences.maxResponseMb * MB,
            followRedirects: preferences.followRedirects,
        },
    }
}

/** With "Auto-refresh Token" on, swaps an expired OAuth 2.0 token for a new one before sending. */
async function refreshExpiredToken(item: HttpItem): Promise<void> {
    const { auth } = item.request
    const token = auth.type === 'oauth2' ? chosenToken(item.id) : undefined

    if (
        auth.type !== 'oauth2' ||
        !token?.refreshToken ||
        !token.expiresAt ||
        !flagValue(auth.values, 'autoRefreshToken')
    ) {
        return
    }

    if (token.expiresAt > Date.now() + 5000) {
        return
    }

    replaceToken(
        token.id,
        await refreshAccessToken(auth.values, token.refreshToken, (request) =>
            sendLogged(request, 'OAuth 2.0 token refresh'),
        ),
    )
}

export async function sendItem(
    item: HttpItem,
    workspaceId: string,
    variables: Variables,
): Promise<void> {
    const startedAt = Date.now()

    useResponses.setState({
        [item.id]: {
            status: 'sending',
            startedAt,
        },
    })
    let request = withPreferences(buildSendRequest(item.request, variables))

    let result: ResponseState

    try {
        await refreshExpiredToken(item)
        request = withPreferences(buildSendRequest(withChosenToken(item).request, variables))
        const response = await sendLogged(request, item.name, item.id, (progress) =>
            useResponses.setState({
                [item.id]: {
                    status: 'sending',
                    startedAt,
                    progress,
                },
            }),
        )

        result = {
            status: 'done',
            response,
        }
    } catch (error) {
        result = {
            status: 'failed',
            message: (error as Error).message,
        }
    }

    useResponses.setState({ [item.id]: result })

    addHistory({
        id: newId(),
        workspaceId,
        itemId: item.id,
        name: item.name,
        method: request.method,
        url: request.url,
        status: result.status === 'done' ? result.response.status : null,
        at: Date.now(),
    })
}
