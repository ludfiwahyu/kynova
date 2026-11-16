import { flagValue, textValue } from '#shared/auth.ts'
import { HEADER, MIME } from '#shared/http.ts'
import { STATUS } from '#shared/http.ts'
import type { AuthParam, AuthValues, SendRequest, SendResponse } from '#shared/types.ts'

export type GrantType =
    | 'authorization_code'
    | 'authorization_code_with_pkce'
    | 'implicit'
    | 'password_credentials'
    | 'client_credentials'

export const GRANT_TYPES: {
    value: GrantType
    label: string
}[] = [
    {
        value: 'authorization_code',
        label: 'Authorization Code',
    },
    {
        value: 'authorization_code_with_pkce',
        label: 'Authorization Code (With PKCE)',
    },
    {
        value: 'implicit',
        label: 'Implicit',
    },
    {
        value: 'password_credentials',
        label: 'Password Credentials',
    },
    {
        value: 'client_credentials',
        label: 'Client Credentials',
    },
]

/** Where the authorization popup returns to when "Authorize using browser" is on. */
export const CALLBACK_PATH = '/oauth2/callback'

export function browserCallbackUrl(): string {
    return `${location.origin}${CALLBACK_PATH}`
}

export interface TokenResponse {
    accessToken: string
    tokenType?: string
    refreshToken?: string
    /** When the token stops working, in ms since 1970. */
    expiresAt?: number
    scope?: string
}

export const grantOf = (values: AuthValues) =>
    textValue(values, 'grant_type', 'authorization_code') as GrantType
export const usesAuthorizationStep = (grant: GrantType) =>
    grant === 'authorization_code' ||
    grant === 'authorization_code_with_pkce' ||
    grant === 'implicit'

export function redirectUri(values: AuthValues): string {
    return flagValue(values, 'useBrowser')
        ? browserCallbackUrl()
        : textValue(values, 'redirect_uri')
}

function randomText(bytes: number): string {
    const data = crypto.getRandomValues(new Uint8Array(bytes))

    return btoa(String.fromCharCode(...data))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
}

async function codeChallenge(verifier: string, method: string): Promise<string> {
    if (method === 'plain') {
        return verifier
    }

    const digest = new Uint8Array(
        await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)),
    )

    return btoa(String.fromCharCode(...digest))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
}

const enabledParams = (values: AuthValues, key: string): AuthParam[] => {
    const rows = values[key]

    return Array.isArray(rows) ? rows.filter((row) => row.enabled !== false && row.key) : []
}

/** The authorization URL to open, with the state and PKCE verifier it was built with. */
export async function authorizationRequest(values: AuthValues): Promise<{
    url: string
    state: string
    verifier: string
}> {
    const grant = grantOf(values)
    const state = textValue(values, 'state') || randomText(12)
    const verifier = textValue(values, 'code_verifier') || randomText(48)

    let url: URL

    try {
        url = new URL(textValue(values, 'authUrl'))
    } catch {
        throw new Error('Enter the Auth URL, including https://.')
    }

    const params = url.searchParams

    params.set('response_type', grant === 'implicit' ? 'token' : 'code')
    params.set('client_id', textValue(values, 'clientId'))

    if (redirectUri(values)) {
        params.set('redirect_uri', redirectUri(values))
    }

    if (textValue(values, 'scope')) {
        params.set('scope', textValue(values, 'scope'))
    }

    params.set('state', state)

    if (grant === 'authorization_code_with_pkce') {
        const method = textValue(values, 'challengeAlgorithm', 'S256')

        params.set('code_challenge', await codeChallenge(verifier, method))
        params.set('code_challenge_method', method)
    }

    for (const row of enabledParams(values, 'authRequestParams')) {
        params.set(row.key, row.value)
    }

    return {
        url: url.toString(),
        state,
        verifier,
    }
}

/** Reads what the authorization server sent back: a code, or (implicit) the token itself. */
export function readRedirect(
    redirect: string,
    state: string,
): { code: string } | { token: TokenResponse } {
    const url = new URL(redirect)
    const params = new URLSearchParams(url.hash.slice(1) || url.search)
    const query = url.searchParams
    const error = params.get('error') ?? query.get('error')

    if (error) {
        throw new Error(
            params.get('error_description') ??
                query.get('error_description') ??
                `The server refused: ${error}.`,
        )
    }

    if ((params.get('state') ?? query.get('state')) !== state) {
        throw new Error('The state in the response does not match the request, so it was not used.')
    }

    if (params.get('access_token')) {
        return { token: tokenFrom(Object.fromEntries(params)) }
    }

    const code = query.get('code')

    if (!code) {
        throw new Error('The response has neither a code nor a token.')
    }

    return { code }
}

function tokenFrom(body: Record<string, unknown>): TokenResponse {
    const text = (key: string) =>
        typeof body[key] === 'string' || typeof body[key] === 'number'
            ? String(body[key])
            : undefined
    const accessToken = text('access_token')

    if (!accessToken) {
        throw new Error('The response has no access_token.')
    }

    const expiresIn = Number(text('expires_in'))

    return {
        accessToken,
        tokenType: text('token_type'),
        refreshToken: text('refresh_token'),
        expiresAt:
            Number.isFinite(expiresIn) && expiresIn > 0 ? Date.now() + expiresIn * 1000 : undefined,
        scope: text('scope'),
    }
}

type Send = (request: SendRequest) => Promise<SendResponse>

/** POSTs a token request, with the client credentials where the settings say and any extra parameters. */
async function requestToken(
    send: Send,
    url: string,
    form: Record<string, string>,
    values: AuthValues,
    extraKey: string,
): Promise<TokenResponse> {
    if (!url) {
        throw new Error('Enter the Access Token URL.')
    }

    const body = new URLSearchParams(form)
    const headers: [string, string][] = [
        [HEADER.contentType, MIME.form],
        ['Accept', MIME.json],
    ]
    const clientId = textValue(values, 'clientId')
    const clientSecret = textValue(values, 'clientSecret')

    if (textValue(values, 'client_authentication', 'header') === 'header' && clientId) {
        const credentials = `${encodeURIComponent(clientId)}:${encodeURIComponent(clientSecret)}`

        headers.push([HEADER.authorization, `Basic ${btoa(credentials)}`])
    } else {
        if (clientId) {
            body.set('client_id', clientId)
        }

        if (clientSecret) {
            body.set('client_secret', clientSecret)
        }
    }

    let target: URL

    try {
        target = new URL(url)
    } catch {
        throw new Error('The token URL is not valid. Include https://.')
    }

    for (const row of enabledParams(values, extraKey)) {
        if (row.send_as === 'request_header') {
            headers.push([row.key, row.value])
        } else if (row.send_as === 'request_url') {
            target.searchParams.set(row.key, row.value)
        } else {
            body.set(row.key, row.value)
        }
    }

    const response = await send({
        method: 'POST',
        url: target.toString(),
        headers,
        body: body.toString(),
    })
    let parsed: Record<string, unknown>

    try {
        parsed = JSON.parse(response.body)
    } catch {
        // Some servers (GitHub, for one) answer in form encoding.
        parsed = Object.fromEntries(new URLSearchParams(response.body))
    }

    if (response.status >= STATUS.badRequest || parsed.error) {
        const reason =
            parsed.error_description ?? parsed.error ?? `${response.status} ${response.statusText}`

        throw new Error(`The token request failed: ${String(reason)}`)
    }

    return tokenFrom(parsed)
}

/**
 * Runs the grant the settings name. `authorize` opens the authorization page
 * and resolves with the URL the server redirected to.
 */
export async function getAccessToken(
    values: AuthValues,
    send: Send,
    authorize: (url: string) => Promise<string>,
): Promise<TokenResponse> {
    const grant = grantOf(values)
    const accessTokenUrl = textValue(values, 'accessTokenUrl')
    const scope = textValue(values, 'scope')
    const withScope = (form: Record<string, string>) =>
        scope
            ? {
                  ...form,
                  scope,
              }
            : form

    if (grant === 'client_credentials') {
        return requestToken(
            send,
            accessTokenUrl,
            withScope({ grant_type: 'client_credentials' }),
            values,
            'tokenRequestParams',
        )
    }

    if (grant === 'password_credentials') {
        const form = {
            grant_type: 'password',
            username: textValue(values, 'username'),
            password: textValue(values, 'password'),
        }

        return requestToken(send, accessTokenUrl, withScope(form), values, 'tokenRequestParams')
    }

    const { url, state, verifier } = await authorizationRequest(values)
    const result = readRedirect(await authorize(url), state)

    if ('token' in result) {
        return result.token
    }

    const form: Record<string, string> = {
        grant_type: 'authorization_code',
        code: result.code,
    }

    if (redirectUri(values)) {
        form.redirect_uri = redirectUri(values)
    }

    if (grant === 'authorization_code_with_pkce') {
        form.code_verifier = verifier
    }

    return requestToken(send, accessTokenUrl, form, values, 'tokenRequestParams')
}

export function refreshAccessToken(
    values: AuthValues,
    refreshToken: string,
    send: Send,
): Promise<TokenResponse> {
    const url = textValue(values, 'refreshTokenUrl') || textValue(values, 'accessTokenUrl')

    return requestToken(
        send,
        url,
        {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        },
        values,
        'refreshRequestParams',
    )
}

/**
 * Opens the authorization window at once (a browser lets a click open a
 * window, but not a promise that settles later) and returns the function that
 * sends it to the authorization page and waits until it comes back to this
 * app's callback page. A callback on another site cannot be read.
 */
export function openAuthorizationWindow(): {
    authorize: (url: string) => Promise<string>
    close: () => void
} {
    const popup = window.open('about:blank', 'kynova-oauth2', 'popup,width=520,height=680')
    const close = () => popup?.close()

    if (!popup) {
        const blocked = () =>
            Promise.reject(
                new Error(
                    'The browser blocked the authorization window. Allow pop-ups for this site and try again.',
                ),
            )

        return {
            authorize: blocked,
            close,
        }
    }

    const authorize = (url: string) =>
        new Promise<string>((resolve, reject) => {
            popup.location.href = url
            const timer = setInterval(() => {
                if (popup.closed) {
                    clearInterval(timer)
                    reject(
                        new Error(
                            'The authorization window was closed before it finished. With a callback URL on another site, turn on "Authorize using browser".',
                        ),
                    )

                    return
                }

                let href: string

                try {
                    href = popup.location.href // Throws while the window shows another site.
                } catch {
                    return
                }

                if (href.startsWith(browserCallbackUrl())) {
                    clearInterval(timer)
                    popup.close()
                    resolve(href)
                }
            }, 250)
        })

    return {
        authorize,
        close,
    }
}
