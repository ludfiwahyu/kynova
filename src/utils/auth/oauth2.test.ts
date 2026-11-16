import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { SendRequest, SendResponse } from '#shared/types.ts'

import { authorizationRequest, getAccessToken, readRedirect, refreshAccessToken } from './oauth2'

/** A token endpoint that records what it was sent and answers with `body`. */
function tokenServer(body: object | string, status = 200) {
    const sent: SendRequest[] = []
    const send = async (request: SendRequest): Promise<SendResponse> => {
        sent.push(request)
        return {
            status,
            statusText: status === 200 ? 'OK' : 'Bad Request',
            headers: [],
            body: typeof body === 'string' ? body : JSON.stringify(body),
            bodyIsBase64: false,
            truncated: false,
            limitBytes: 0,
            sizeBytes: 0,
            timeMs: 1,
        }
    }
    return {
        sent,
        send,
    }
}

const header = (request: SendRequest, name: string) =>
    request.headers.find(([key]) => key === name)?.[1]
const noAuthorization = () => Promise.reject(new Error('not expected'))

test('client credentials: credentials in a Basic header, scope and extra parameters where asked', async () => {
    const { sent, send } = tokenServer({
        access_token: 'abc',
        token_type: 'Bearer',
        expires_in: 3600,
    })
    const token = await getAccessToken(
        {
            grant_type: 'client_credentials',
            accessTokenUrl: 'https://auth.example.com/token',
            clientId: 'my app',
            clientSecret: 's3cret',
            scope: 'read write',
            tokenRequestParams: [
                {
                    key: 'audience',
                    value: 'api',
                    send_as: 'request_body',
                },
                {
                    key: 'X-Trace',
                    value: '1',
                    send_as: 'request_header',
                },
                {
                    key: 'tenant',
                    value: 't1',
                    send_as: 'request_url',
                },
                {
                    key: 'off',
                    value: 'x',
                    enabled: false,
                },
            ],
        },
        send,
        noAuthorization,
    )
    assert.equal(token.accessToken, 'abc')
    assert.ok(token.expiresAt! > Date.now() + 3_500_000)

    const [request] = sent
    assert.equal(request.method, 'POST')
    assert.equal(request.url, 'https://auth.example.com/token?tenant=t1')
    assert.equal(header(request, 'Authorization'), `Basic ${btoa('my%20app:s3cret')}`)
    assert.equal(header(request, 'X-Trace'), '1')
    assert.deepEqual(Object.fromEntries(new URLSearchParams(request.body!)), {
        grant_type: 'client_credentials',
        scope: 'read write',
        audience: 'api',
    })
})

test('password grant with credentials in the body', async () => {
    const { sent, send } = tokenServer({
        access_token: 'p',
        refresh_token: 'r',
    })
    const token = await getAccessToken(
        {
            grant_type: 'password_credentials',
            accessTokenUrl: 'https://a.example/token',
            clientId: 'c',
            clientSecret: 's',
            client_authentication: 'body',
            username: 'u',
            password: 'pw',
        },
        send,
        noAuthorization,
    )
    assert.equal(token.refreshToken, 'r')
    assert.equal(header(sent[0], 'Authorization'), undefined)
    assert.deepEqual(Object.fromEntries(new URLSearchParams(sent[0].body!)), {
        grant_type: 'password',
        username: 'u',
        password: 'pw',
        client_id: 'c',
        client_secret: 's',
    })
})

test('authorization code with PKCE: opens the page, checks the state, exchanges the code', async () => {
    const { sent, send } = tokenServer('access_token=gh&token_type=bearer&scope=repo') // Form-encoded, as GitHub answers.
    let opened = ''
    const values = {
        grant_type: 'authorization_code_with_pkce',
        authUrl: 'https://auth.example.com/authorize?prompt=consent',
        accessTokenUrl: 'https://auth.example.com/token',
        redirect_uri: 'https://app.example.com/callback',
        clientId: 'c',
        scope: 'repo',
        state: 'st4te',
        code_verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
        authRequestParams: [
            {
                key: 'audience',
                value: 'api',
            },
        ],
    }
    const token = await getAccessToken(values, send, async (url) => {
        opened = url
        return 'https://app.example.com/callback?code=the-code&state=st4te'
    })
    assert.equal(token.accessToken, 'gh')

    const page = new URL(opened).searchParams
    assert.equal(page.get('prompt'), 'consent')
    assert.equal(page.get('response_type'), 'code')
    assert.equal(page.get('redirect_uri'), 'https://app.example.com/callback')
    assert.equal(
        page.get('code_challenge'),
        'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
        'the RFC 7636 example',
    )
    assert.equal(page.get('code_challenge_method'), 'S256')
    assert.equal(page.get('audience'), 'api')

    const form = Object.fromEntries(new URLSearchParams(sent[0].body!))
    assert.deepEqual(form, {
        grant_type: 'authorization_code',
        code: 'the-code',
        redirect_uri: 'https://app.example.com/callback',
        code_verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
    })
})

test('implicit grant reads the token from the redirect fragment, with no token request', async () => {
    const { sent, send } = tokenServer({})
    const token = await getAccessToken(
        {
            grant_type: 'implicit',
            authUrl: 'https://a.example/authorize',
            clientId: 'c',
            state: 's',
        },
        send,
        async () =>
            'https://app.example.com/cb#access_token=imp&token_type=bearer&expires_in=60&state=s',
    )
    assert.equal(token.accessToken, 'imp')
    assert.equal(sent.length, 0)
})

test('a redirect with the wrong state, an error, or nothing usable is refused', () => {
    assert.throws(() => readRedirect('https://a.example/cb?code=c&state=other', 'mine'), /state/)
    assert.throws(
        () =>
            readRedirect(
                'https://a.example/cb?error=access_denied&error_description=User%20said%20no&state=mine',
                'mine',
            ),
        /User said no/,
    )
    assert.throws(
        () => readRedirect('https://a.example/cb?state=mine', 'mine'),
        /neither a code nor a token/,
    )
})

test('a refused token request reports the server’s reason', async () => {
    const { send } = tokenServer(
        {
            error: 'invalid_client',
            error_description: 'Unknown client.',
        },
        401,
    )
    await assert.rejects(
        getAccessToken(
            {
                grant_type: 'client_credentials',
                accessTokenUrl: 'https://a.example/token',
            },
            send,
            noAuthorization,
        ),
        /Unknown client\./,
    )
    await assert.rejects(
        getAccessToken(
            {
                grant_type: 'client_credentials',
                accessTokenUrl: '',
            },
            send,
            noAuthorization,
        ),
        /Access Token URL/,
    )
    await assert.rejects(
        authorizationRequest({
            grant_type: 'authorization_code',
            authUrl: 'not a url',
        }),
        /Auth URL/,
    )
})

test('refreshing uses the refresh URL, or the token URL when there is none', async () => {
    const { sent, send } = tokenServer({ access_token: 'new' })
    await refreshAccessToken(
        {
            accessTokenUrl: 'https://a.example/token',
            refreshRequestParams: [
                {
                    key: 'k',
                    value: 'v',
                },
            ],
        },
        'old-refresh',
        send,
    )
    await refreshAccessToken(
        {
            accessTokenUrl: 'https://a.example/token',
            refreshTokenUrl: 'https://a.example/refresh',
        },
        'old-refresh',
        send,
    )
    assert.equal(sent[0].url, 'https://a.example/token')
    assert.equal(sent[1].url, 'https://a.example/refresh')
    assert.deepEqual(Object.fromEntries(new URLSearchParams(sent[0].body!)), {
        grant_type: 'refresh_token',
        refresh_token: 'old-refresh',
        k: 'v',
    })
})
