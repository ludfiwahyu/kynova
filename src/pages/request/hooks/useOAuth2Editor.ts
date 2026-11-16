import { useState } from 'react'

import { authTypeOf } from '@/pages/request/logic/authTypes'
import { authorizes, PARAM_BLOCKS } from '@/pages/request/logic/config'
import { resolveValues } from '@/pages/request/logic/helpers'
import { toTokenOptions } from '@/pages/request/logic/mappers'
import type { OAuth2EditorProps, OAuthStatus } from '@/pages/request/types'
import { addToken, chooseToken, deleteToken, sendLogged, useOAuthTokens } from '@/stores'
import {
    browserCallbackUrl,
    getAccessToken,
    grantOf,
    openAuthorizationWindow,
    usesAuthorizationStep,
} from '@/utils'
import { flagValue, textValue } from '#shared/auth.ts'
import type { AuthParam, AuthValues, SendRequest } from '#shared/types.ts'

export function useOAuth2Editor({
    itemId,
    auth,
    onChange,
    disabled,
    variables,
}: OAuth2EditorProps) {
    const { values } = auth
    const { defaults } = authTypeOf('oauth2')
    const merged = {
        ...defaults,
        ...values,
    }

    const tokens = useOAuthTokens((state) => state.tokens)
    const chosenId = useOAuthTokens((state) => state.chosen[itemId])
    const chosen = tokens.find((token) => token.id === chosenId)

    const [status, setStatus] = useState<OAuthStatus | null>(null)

    const shared = textValue(values, 'accessToken')
    const isShared = Boolean(shared) && (!chosen || chosen.accessToken === shared)

    function setValues(changes: AuthValues) {
        onChange({
            ...auth,
            values: {
                ...values,
                ...changes,
            },
        })
    }

    const fieldProps = {
        values,
        defaults,
        disabled,
        variables,
        onChange: (key: string, value: AuthValues[string]) => setValues({ [key]: value }),
    }

    // View model

    const tokenOptions = toTokenOptions(tokens)
    const tokenText = chosen ? chosen.accessToken : shared
    const tokenTitle = chosen
        ? 'A token you got. Choose “Available Tokens” to type one instead.'
        : undefined
    const canShare = !disabled && (Boolean(chosen) || Boolean(shared))
    const showBrowserNote = authorizes(merged) && flagValue(merged, 'useBrowser')
    const isBusy = status?.kind === 'busy'
    const isError = status?.kind === 'error'
    const statusClass = `auth-status ${isError ? 'form-error' : 'auth-note'}`
    const statusRole = isError ? 'alert' : 'status'

    const paramBlocks = PARAM_BLOCKS.filter(
        (block) => block.key !== 'authRequestParams' || authorizes(merged),
    ).map((block) => ({
        ...block,
        rows: Array.isArray(values[block.key]) ? (values[block.key] as AuthParam[]) : [],
    }))

    // Actions

    async function requestToken() {
        const resolved = resolveValues(merged, variables)
        const window = usesAuthorizationStep(grantOf(resolved)) ? openAuthorizationWindow() : null

        setStatus({
            kind: 'busy',
            message: 'Getting a new access token…',
        })

        try {
            const send = (request: SendRequest) =>
                sendLogged(request, 'OAuth 2.0 token request', itemId)

            const token = await getAccessToken(
                resolved,
                send,
                window?.authorize ?? (() => Promise.reject(new Error('No authorization step.'))),
            )

            const saved = addToken(itemId, textValue(values, 'tokenName'), token)

            if (isShared) {
                setValues({ accessToken: saved.accessToken })
            }

            setStatus({
                kind: 'done',
                message: `Got “${saved.name}”. This request uses it now.`,
            })
        } catch (error) {
            window?.close()
            setStatus({
                kind: 'error',
                message: (error as Error).message,
            })
        }
    }

    function getNewToken() {
        void requestToken()
    }

    function share(on: boolean) {
        if (on && chosen) {
            setValues({
                accessToken: chosen.accessToken,
                ...(chosen.tokenType && { tokenType: chosen.tokenType }),
            })
        }

        if (!on) {
            // Keeps the token for this person before taking it out of the request.
            if (shared && !tokens.some((token) => token.accessToken === shared)) {
                addToken(itemId, 'Shared token', { accessToken: shared })
            }

            setValues({ accessToken: '' })
        }
    }

    function chooseOption(id: string) {
        chooseToken(itemId, id || null)
    }

    function removeChosen() {
        if (chosen) {
            deleteToken(chosen.id)
        }
    }

    function typeToken(accessToken: string) {
        setValues({ accessToken })
    }

    function setAutoRefresh(on: boolean) {
        setValues({ autoRefreshToken: on })
    }

    function setParams(key: string, rows: AuthParam[]) {
        setValues({ [key]: rows })
    }

    return {
        fieldProps,
        status,
        chosen,
        tokenOptions,
        tokenText,
        tokenTitle,
        isShared,
        canShare,
        autoRefresh: flagValue(values, 'autoRefreshToken'),
        showBrowserNote,
        callbackUrl: browserCallbackUrl(),
        isBusy,
        statusClass,
        statusRole,
        paramBlocks,
        getNewToken,
        share,
        chooseOption,
        removeChosen,
        typeToken,
        setAutoRefresh,
        setParams,
    }
}
