import { Radio, SendHorizontal } from 'lucide-react'

import type { AuthField } from '@/pages/request/logic/authTypes'
import type { Phase, RequestItem } from '@/pages/request/types'
import { definePage, GRANT_TYPES, grantOf, usesAuthorizationStep } from '@/utils'
import { textValue } from '#shared/auth.ts'
import { flagValue } from '#shared/auth.ts'
import type { AuthValues, Body, Item, RawLanguage } from '#shared/types.ts'

export const requestPage = definePage({
    id: 'request',
    title: 'Request',
    description: 'An HTTP request: its URL, parameters, authorization, headers, body and scripts.',
    tabs: [
        {
            id: 'params',
            label: 'Params',
        },
        {
            id: 'auth',
            label: 'Authorization',
        },
        {
            id: 'headers',
            label: 'Headers',
        },
        {
            id: 'body',
            label: 'Body',
        },
        {
            id: 'scripts',
            label: 'Scripts',
        },
    ],
})

export const TYPES: {
    id: Body['type']
    label: string
}[] = [
    {
        id: 'none',
        label: 'none',
    },
    {
        id: 'urlencoded',
        label: 'x-www-form-urlencoded',
    },
    {
        id: 'raw',
        label: 'raw',
    },
]

export const LANGUAGES: {
    id: RawLanguage
    label: string
}[] = [
    {
        id: 'json',
        label: 'JSON',
    },
    {
        id: 'text',
        label: 'Text',
    },
    {
        id: 'javascript',
        label: 'JavaScript',
    },
    {
        id: 'html',
        label: 'HTML',
    },
    {
        id: 'xml',
        label: 'XML',
    },
]

export const JSON_PLACEHOLDER = '{\n  "name": "value"\n}'

export const REQUEST_TYPES = [
    {
        kind: 'http',
        label: 'HTTP',
        icon: SendHorizontal,
    },
    {
        kind: 'websocket',
        label: 'WebSocket',
        icon: Radio,
    },
] as const

export const isRequest = (item: Item): item is RequestItem =>
    item.kind === 'http' || item.kind === 'websocket'

export const REQUEST_SHARE = {
    min: 0.15,
    max: 0.85,
}

/** Side by side, either pane keeps at least this share of the width. */
export const SIDE_SHARE = {
    min: 0.2,
    max: 0.8,
}

export const clampShare = (
    value: number,
    {
        min,
        max,
    }: {
        min: number
        max: number
    },
) => Math.min(max, Math.max(min, value))

export const RESPONSE_PLACES = {
    bottom: 'Below the request',
    left: 'Left of the request',
    right: 'Right of the request',
}

export const PHASES: {
    id: Phase
    label: string
    placeholder: string
}[] = [
    {
        id: 'preRequest',
        label: 'Pre-request',
        placeholder: '// Runs before the request is sent.',
    },
    {
        id: 'test',
        label: 'Post-response',
        placeholder: '// Runs after the response arrives.',
    },
]

/** A select whose choices stand for true and false keeps a boolean, as the collection format stores it. */
export const isFlagSelect = (field: AuthField) =>
    field.options?.every(({ value }) => value === 'true' || value === 'false') ?? false

export const grantIs =
    (...grants: string[]) =>
    (values: AuthValues) =>
        grants.includes(grantOf(values))

export const notGrant =
    (...grants: string[]) =>
    (values: AuthValues) =>
        !grants.includes(grantOf(values))

export const authorizes = (values: AuthValues) => usesAuthorizationStep(grantOf(values))

export const NEW_TOKEN_FIELDS: AuthField[] = [
    {
        key: 'tokenName',
        label: 'Token Name',
        placeholder: 'Enter a token name…',
    },
    {
        key: 'grant_type',
        label: 'Grant type',
        kind: 'select',
        options: GRANT_TYPES,
    },
    {
        key: 'redirect_uri',
        label: 'Callback URL',
        placeholder: 'https://your-application.com/registered/callback',
        when: (values) => authorizes(values) && !flagValue(values, 'useBrowser'),
        info: 'Where the authorization server sends the browser back to. It must match the URL registered with the server.',
    },
    {
        key: 'useBrowser',
        label: 'Authorize using browser',
        kind: 'check',
        when: authorizes,
    },
    {
        key: 'authUrl',
        label: 'Auth URL',
        placeholder: 'https://example.com/login/oauth/authorize',
        when: authorizes,
        info: 'The authorization server’s sign-in page.',
    },
    {
        key: 'accessTokenUrl',
        label: 'Access Token URL',
        placeholder: 'https://example.com/login/oauth/access_token',
        when: notGrant('implicit'),
        info: 'Where the token is requested.',
    },
    {
        key: 'clientId',
        label: 'Client ID',
        placeholder: 'Client ID',
        info: 'The identifier the server gave your application.',
    },
    {
        key: 'clientSecret',
        label: 'Client Secret',
        placeholder: 'Client Secret',
        when: notGrant('implicit'),
        info: 'The secret the server gave your application.',
    },
    {
        key: 'challengeAlgorithm',
        label: 'Code Challenge Method',
        kind: 'select',
        options: [
            {
                value: 'S256',
                label: 'SHA-256',
            },
            {
                value: 'plain',
                label: 'Plain',
            },
        ],
        when: grantIs('authorization_code_with_pkce'),
    },
    {
        key: 'code_verifier',
        label: 'Code Verifier',
        placeholder: 'Generated when empty',
        when: grantIs('authorization_code_with_pkce'),
        info: 'A random string of 43 to 128 characters. Generated for each token when empty.',
    },
    {
        key: 'username',
        label: 'Username',
        placeholder: 'Username',
        when: grantIs('password_credentials'),
    },
    {
        key: 'password',
        label: 'Password',
        placeholder: 'Password',
        when: grantIs('password_credentials'),
    },
    {
        key: 'scope',
        label: 'Scope',
        placeholder: 'e.g. read:org',
        info: 'The access asked for, separated by spaces.',
    },
    {
        key: 'state',
        label: 'State',
        placeholder: 'Generated when empty',
        when: authorizes,
        info: 'Checked when the server answers, against cross-site request forgery.',
    },
    {
        key: 'client_authentication',
        label: 'Client Authentication',
        kind: 'select',
        options: [
            {
                value: 'header',
                label: 'Send as Basic Auth header',
            },
            {
                value: 'body',
                label: 'Send client credentials in body',
            },
        ],
        when: notGrant('implicit'),
        info: 'How the client ID and secret go with the token request.',
    },
]

export const SEND_IN = [
    {
        value: 'request_body',
        label: 'Request Body',
    },
    {
        value: 'request_header',
        label: 'Request Header',
    },
    {
        value: 'request_url',
        label: 'Request URL',
    },
]

export const SCRIPT_MIN_ROWS = 14

export const SCRIPTS_NOTE =
    'Scripts are saved with the request and exported with the collection. Kynova does not run them.'

export const URL_PLACEHOLDER = 'Enter URL or paste text'

export const SEND_LABELS = {
    idle: 'Send',
    sending: 'Sending…',
}

export const MIN_POPOVER_WIDTH = 200

export const MAX_METHOD_LENGTH = 24

export const CARET_ICON_SIZE = 14

export const SETTINGS_ICON_SIZE = 15

export const AUTO_CLOSING = {
    off: 'never',
    on: 'languageDefined',
} as const

export const PROGRESS_TICK_MS = 100

export const MAX_PROGRESS_PERCENT = 99

export const RESPONSE_ENTER_SECONDS = 0.18

export const EMPTY_ICON_SIZE = 28

export const EMPTY_ICON_STROKE = 1.4

export const VIEW_TABS = [
    {
        id: 'body',
        label: 'Body',
    },
    {
        id: 'headers',
        label: 'Headers',
    },
] as const

export const KIND_BADGE = {
    http: 'HTTP',
    websocket: 'WS',
}

export const HEADER_ICON_SIZE = 14

export const BADGE_CARET_SIZE = 10

export const SEPARATOR_ICON_SIZE = 13

export const MIN_NAME_SIZE = 8

export const NAME_SIZE_PADDING = 2

export const SPLIT_FIRST_VAR = '--split-first'

export const SPLIT_SECOND_VAR = '--split-second'

export const AUTH_ICON_SIZE = 15

export const INFO_ICON_SIZE = 13

export const ADVANCED_ICON_SIZE = 14

export const CODE_ROWS = 6

export const KEY_ROWS = 5

export const PARAM_BLOCKS = [
    {
        key: 'authRequestParams',
        label: 'Auth Request',
        sendIn: false,
        info: 'Extra parameters for the authorization page.',
    },
    {
        key: 'tokenRequestParams',
        label: 'Token Request',
        sendIn: true,
        info: 'Extra parameters for the token request.',
    },
    {
        key: 'refreshRequestParams',
        label: 'Refresh Request',
        sendIn: true,
        info: 'Extra parameters for the refresh request.',
    },
] as const

export const HEADER_PREFIX_FIELDS = [
    {
        key: 'headerPrefix',
        label: 'Header Prefix',
        info: 'Written before the token in the Authorization header.',
        when: (values: AuthValues) => textValue(values, 'addTokenTo', 'header') === 'header',
    },
]

export const REFRESH_URL_FIELDS = [
    {
        key: 'refreshTokenUrl',
        label: 'Refresh Token URL',
        placeholder: 'https://example.com/login/oauth/refresh_token',
        info: 'Where tokens are refreshed. The Access Token URL when empty.',
    },
]
