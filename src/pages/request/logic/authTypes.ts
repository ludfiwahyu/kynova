import type { LucideIcon } from 'lucide-react'
import {
    Building2,
    Cloud,
    FileKey2,
    Fingerprint,
    KeyRound,
    KeySquare,
    Lock,
    Network,
    RectangleEllipsis,
    ShieldCheck,
    ShieldEllipsis,
    ShieldOff,
    Ticket,
} from 'lucide-react'

import { flagValue, textValue } from '#shared/auth.ts'
import type { Auth, AuthValues } from '#shared/types.ts'

export interface AuthField {
    /** The key name in the collection format. */
    key: string
    label: string
    /** `text` by default. `check` stores true or false; `code` holds JSON; `key` holds a PEM private key. */
    kind?: 'text' | 'select' | 'check' | 'code' | 'key'
    options?: {
        value: string
        label: string
    }[]
    placeholder?: string
    /** Shown on hover over the info mark next to the label. */
    info?: string
    /** In the left column under the type, where the "Add to" choices go. */
    side?: boolean
    /** Under "Advanced configuration". */
    advanced?: boolean
    /** For a check: on means the setting is false (the format's "disable…" settings, shown as "do…"). */
    inverted?: boolean
    /** Shown only when this holds. */
    when?: (values: AuthValues) => boolean
}

export interface AuthType {
    type: Auth['type']
    label: string
    icon: LucideIcon
    /** Draws a line above it in the list. */
    startsGroup?: boolean
    /** Under the type picker; null for none. */
    note: string | null
    /** A second note, after the side settings. */
    sideNote?: (values: AuthValues) => string | null
    /** The line above the advanced settings. */
    advancedNote?: string
    fields: AuthField[]
    defaults: AuthValues
}

const GENERATED_HEADER =
    'The authorization header will be generated automatically when you send the request.'
const GENERATED_DATA =
    'The authorization data will be generated automatically when you send the request.'
const FILLS_DEFAULTS = 'Kynova generates values for some of these fields unless you set one.'

const usesSecret = (values: AuthValues) => textValue(values, 'algorithm', 'HS256').startsWith('HS')
const oauth1UsesRsa = (values: AuthValues) =>
    textValue(values, 'signatureMethod', 'HMAC-SHA1').startsWith('RSA')
const oauth1InHeader = (values: AuthValues) => flagValue(values, 'addParamsToHeader', true)

const options = (...values: string[]) =>
    values.map((value) => ({
        value,
        label: value,
    }))

const DIGEST_ALGORITHMS = options(
    'MD5',
    'MD5-sess',
    'SHA-256',
    'SHA-256-sess',
    'SHA-512-256',
    'SHA-512-256-sess',
)
const JWT_ALGORITHMS = options(
    'HS256',
    'HS384',
    'HS512',
    'RS256',
    'RS384',
    'RS512',
    'PS256',
    'PS384',
    'PS512',
    'ES256',
    'ES384',
    'ES512',
)
const PRIVATE_KEY_PLACEHOLDER = '-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----'

export const AUTH_TYPES: AuthType[] = [
    {
        type: 'apikey',
        label: 'API Key',
        icon: KeyRound,
        note: GENERATED_HEADER,
        fields: [
            {
                key: 'key',
                label: 'Key',
                placeholder: 'Key',
            },
            {
                key: 'value',
                label: 'Value',
                placeholder: 'Value',
            },
            {
                key: 'addTo',
                label: 'Add to',
                kind: 'select',
                options: [
                    {
                        value: 'header',
                        label: 'Header',
                    },
                    {
                        value: 'query',
                        label: 'Query Params',
                    },
                ],
            },
        ],
        defaults: {
            key: '',
            value: '',
            addTo: 'header',
        },
    },
    {
        type: 'basic',
        label: 'Basic Auth',
        icon: RectangleEllipsis,
        note: GENERATED_HEADER,
        fields: [
            {
                key: 'username',
                label: 'Username',
                placeholder: 'Username',
            },
            {
                key: 'password',
                label: 'Password',
                placeholder: 'Password',
            },
        ],
        defaults: {
            username: '',
            password: '',
        },
    },
    {
        type: 'bearer',
        label: 'Bearer Token',
        icon: Ticket,
        note: GENERATED_HEADER,
        fields: [
            {
                key: 'token',
                label: 'Token',
                placeholder: 'Token',
            },
        ],
        defaults: { token: '' },
    },
    {
        type: 'digest',
        label: 'Digest Auth',
        icon: Lock,
        note: GENERATED_HEADER,
        sideNote: () =>
            'By default, Kynova reads the challenge from the 401 response, adds the answer to the request, and sends it again.',
        advancedNote: FILLS_DEFAULTS,
        fields: [
            {
                key: 'disableRetryRequest',
                label: 'Yes, disable retrying the request',
                kind: 'check',
                side: true,
            },
            {
                key: 'username',
                label: 'Username',
                placeholder: 'Username',
            },
            {
                key: 'password',
                label: 'Password',
                placeholder: 'Password',
            },
            {
                key: 'realm',
                label: 'Realm',
                placeholder: 'testrealm@example.com',
                advanced: true,
                info: 'The protection space the server names in its challenge.',
            },
            {
                key: 'nonce',
                label: 'Nonce',
                placeholder: 'Nonce',
                advanced: true,
                info: 'A value the server issues with its challenge. Filled in from the 401 response when empty.',
            },
            {
                key: 'algorithm',
                label: 'Algorithm',
                kind: 'select',
                options: DIGEST_ALGORITHMS,
                advanced: true,
                info: 'The hash used for the response. Most servers use MD5.',
            },
            {
                key: 'qop',
                label: 'qop',
                placeholder: 'e.g. auth-int',
                advanced: true,
                info: 'Quality of protection: auth, or auth-int to also cover the body.',
            },
            {
                key: 'nonceCount',
                label: 'Nonce Count',
                placeholder: 'e.g. 00000001',
                advanced: true,
                info: 'How many requests used this nonce, in 8 hexadecimal digits.',
            },
            {
                key: 'clientNonce',
                label: 'Client Nonce',
                placeholder: 'e.g. 0a4f113b',
                advanced: true,
                info: 'A random value from the client. Generated when empty.',
            },
            {
                key: 'opaque',
                label: 'Opaque',
                placeholder: 'Opaque',
                advanced: true,
                info: 'A value from the server that is sent back unchanged.',
            },
        ],
        defaults: {
            algorithm: 'MD5',
            username: '',
            password: '',
        },
    },
    {
        type: 'hawk',
        label: 'Hawk Authentication',
        icon: Fingerprint,
        note: GENERATED_HEADER,
        advancedNote: FILLS_DEFAULTS,
        fields: [
            {
                key: 'authId',
                label: 'Hawk Auth ID',
                placeholder: 'Hawk Auth ID',
            },
            {
                key: 'authKey',
                label: 'Hawk Auth Key',
                placeholder: 'Hawk Auth Key',
            },
            {
                key: 'algorithm',
                label: 'Algorithm',
                kind: 'select',
                options: [
                    {
                        value: 'sha256',
                        label: 'SHA-256',
                    },
                    {
                        value: 'sha1',
                        label: 'SHA-1',
                    },
                ],
            },
            {
                key: 'user',
                label: 'User',
                placeholder: 'Username',
                advanced: true,
            },
            {
                key: 'nonce',
                label: 'Nonce',
                placeholder: 'Nonce',
                advanced: true,
                info: 'A random value for this request. Generated when empty.',
            },
            {
                key: 'extraData',
                label: 'ext',
                placeholder: 'e.g. some-app-extra-data',
                advanced: true,
                info: 'Extra application data, included in the signature.',
            },
            {
                key: 'app',
                label: 'app',
                placeholder: 'Application ID',
                advanced: true,
                info: 'The application the credentials were issued to (Oz).',
            },
            {
                key: 'delegation',
                label: 'dlg',
                placeholder: 'e.g. delegated-by',
                advanced: true,
                info: 'The application that delegated access (Oz). Used only with app.',
            },
            {
                key: 'timestamp',
                label: 'Timestamp',
                placeholder: 'Timestamp',
                advanced: true,
                info: 'Seconds since 1970. The current time when empty.',
            },
            {
                key: 'includePayloadHash',
                label: 'Include payload hash',
                kind: 'check',
                advanced: true,
                info: 'Signs the body and its content type too.',
            },
        ],
        defaults: {
            authId: '',
            authKey: '',
            algorithm: 'sha256',
            includePayloadHash: false,
        },
    },
    {
        type: 'jwt',
        label: 'JWT Bearer',
        icon: FileKey2,
        note: GENERATED_HEADER,
        advancedNote: FILLS_DEFAULTS,
        fields: [
            {
                key: 'addTokenTo',
                label: 'Add JWT token to',
                kind: 'select',
                side: true,
                options: [
                    {
                        value: 'header',
                        label: 'Request Header',
                    },
                    {
                        value: 'queryParam',
                        label: 'Query Param',
                    },
                ],
            },
            {
                key: 'algorithm',
                label: 'Algorithm',
                kind: 'select',
                options: JWT_ALGORITHMS,
                info: 'HS uses a shared secret; RS, PS and ES use a private key.',
            },
            {
                key: 'secret',
                label: 'Secret',
                when: usesSecret,
                info: 'The shared secret the token is signed with.',
            },
            {
                key: 'isSecretBase64Encoded',
                label: 'Secret Base64 encoded',
                kind: 'check',
                when: usesSecret,
            },
            {
                key: 'privateKey',
                label: 'Private key',
                kind: 'key',
                placeholder: PRIVATE_KEY_PLACEHOLDER,
                when: (values) => !usesSecret(values),
                info: 'A PEM private key that matches the algorithm.',
            },
            {
                key: 'payload',
                label: 'Payload',
                kind: 'code',
                info: 'The claims, as a JSON object.',
            },
            {
                key: 'headerPrefix',
                label: 'Request header prefix',
                advanced: true,
                when: (values) => textValue(values, 'addTokenTo', 'header') === 'header',
                info: 'Written before the token in the Authorization header.',
            },
            {
                key: 'queryParamKey',
                label: 'Query param name',
                advanced: true,
                when: (values) => textValue(values, 'addTokenTo') === 'queryParam',
            },
            {
                key: 'header',
                label: 'JWT headers',
                kind: 'code',
                advanced: true,
                info: 'Extra header fields, as a JSON object. alg and typ are added for you.',
            },
        ],
        defaults: {
            algorithm: 'HS256',
            secret: '',
            isSecretBase64Encoded: false,
            payload: '{}',
            addTokenTo: 'header',
            headerPrefix: 'Bearer',
            queryParamKey: 'token',
            header: '{}',
        },
    },
    {
        type: 'oauth1',
        label: 'OAuth 1.0',
        icon: ShieldCheck,
        note: GENERATED_DATA,
        sideNote: (values) =>
            oauth1InHeader(values)
                ? null
                : 'Kynova adds them to a URL-encoded body when the request has one, and to the URL otherwise.',
        advancedNote: FILLS_DEFAULTS,
        fields: [
            {
                key: 'addParamsToHeader',
                label: 'Add authorization data to',
                kind: 'select',
                side: true,
                options: [
                    {
                        value: 'true',
                        label: 'Request Headers',
                    },
                    {
                        value: 'false',
                        label: 'Request Body / Request URL',
                    },
                ],
            },
            {
                key: 'signatureMethod',
                label: 'Signature Method',
                kind: 'select',
                options: options(
                    'HMAC-SHA1',
                    'HMAC-SHA256',
                    'HMAC-SHA512',
                    'RSA-SHA1',
                    'RSA-SHA256',
                    'RSA-SHA512',
                    'PLAINTEXT',
                ),
                info: 'How the request is signed.',
            },
            {
                key: 'consumerKey',
                label: 'Consumer Key',
                placeholder: 'Consumer Key',
                info: 'Identifies the client to the service.',
            },
            {
                key: 'consumerSecret',
                label: 'Consumer Secret',
                placeholder: 'Consumer Secret',
                when: (values) => !oauth1UsesRsa(values),
                info: 'The client secret, part of the signing key.',
            },
            {
                key: 'privateKey',
                label: 'Private Key',
                kind: 'key',
                placeholder: PRIVATE_KEY_PLACEHOLDER,
                when: oauth1UsesRsa,
                info: 'The RSA private key in PEM format.',
            },
            {
                key: 'token',
                label: 'Access Token',
                placeholder: 'Access Token',
            },
            {
                key: 'tokenSecret',
                label: 'Token Secret',
                placeholder: 'Token Secret',
                when: (values) => !oauth1UsesRsa(values),
                info: 'The token secret, part of the signing key.',
            },
            {
                key: 'callback',
                label: 'Callback URL',
                placeholder: 'Callback URL',
                advanced: true,
                info: 'Where the service sends the user after authorizing.',
            },
            {
                key: 'verifier',
                label: 'Verifier',
                placeholder: 'Verifier',
                advanced: true,
                info: 'The verification code from the authorization step.',
            },
            {
                key: 'timestamp',
                label: 'Timestamp',
                placeholder: 'Timestamp',
                advanced: true,
            },
            {
                key: 'nonce',
                label: 'Nonce',
                placeholder: 'Nonce',
                advanced: true,
                info: 'A random value for this request. Generated when empty.',
            },
            {
                key: 'version',
                label: 'Version',
                placeholder: '1.0',
                advanced: true,
            },
            {
                key: 'realm',
                label: 'Realm',
                placeholder: 'testrealm@example.com',
                advanced: true,
                info: 'Added to the Authorization header, not signed.',
            },
            {
                key: 'includeBodyHash',
                label: 'Include body hash',
                kind: 'check',
                advanced: true,
                info: 'Adds oauth_body_hash for bodies that are not URL-encoded forms.',
            },
            {
                key: 'addEmptyParamsToSign',
                label: 'Add empty parameters to signature',
                kind: 'check',
                advanced: true,
                info: 'Signs OAuth parameters that have no value instead of leaving them out.',
            },
            {
                key: 'disableHeaderEncoding',
                label: 'Encode the parameters in the Authorization header',
                kind: 'check',
                inverted: true,
                advanced: true,
                when: oauth1InHeader,
            },
        ],
        defaults: {
            signatureMethod: 'HMAC-SHA1',
            consumerKey: '',
            consumerSecret: '',
            token: '',
            tokenSecret: '',
            version: '1.0',
            addParamsToHeader: true,
            addEmptyParamsToSign: false,
            includeBodyHash: false,
            disableHeaderEncoding: false,
        },
    },
    {
        type: 'oauth2',
        label: 'OAuth 2.0',
        icon: ShieldEllipsis,
        note: GENERATED_DATA,
        fields: [
            {
                key: 'addTokenTo',
                label: 'Add authorization data to',
                kind: 'select',
                side: true,
                options: [
                    {
                        value: 'header',
                        label: 'Request Headers',
                    },
                    {
                        value: 'queryParams',
                        label: 'Request URL',
                    },
                ],
            },
        ],
        defaults: {
            addTokenTo: 'header',
            headerPrefix: 'Bearer',
            grant_type: 'authorization_code',
            client_authentication: 'header',
            challengeAlgorithm: 'S256',
        },
    },
    {
        type: 'edgegrid',
        label: 'Akamai EdgeGrid',
        icon: Network,
        startsGroup: true,
        note: GENERATED_HEADER,
        advancedNote: FILLS_DEFAULTS,
        fields: [
            {
                key: 'accessToken',
                label: 'Access Token',
                placeholder: 'Access Token',
            },
            {
                key: 'clientToken',
                label: 'Client Token',
                placeholder: 'Client Token',
            },
            {
                key: 'clientSecret',
                label: 'Client Secret',
                placeholder: 'Client Secret',
            },
            {
                key: 'nonce',
                label: 'Nonce',
                placeholder: 'Nonce',
                advanced: true,
                info: 'A unique value for this request. Generated when empty.',
            },
            {
                key: 'timestamp',
                label: 'Timestamp',
                placeholder: 'e.g. 20240101T12:00:00+0000',
                advanced: true,
                info: 'UTC time of the request. The current time when empty.',
            },
            {
                key: 'headersToSign',
                label: 'Headers to Sign',
                placeholder: 'e.g. x-custom-header',
                advanced: true,
                info: 'Comma-separated names of headers to include in the signature.',
            },
        ],
        defaults: {
            accessToken: '',
            clientToken: '',
            clientSecret: '',
        },
    },
    {
        type: 'asap',
        label: 'ASAP (Atlassian)',
        icon: KeySquare,
        note: GENERATED_HEADER,
        advancedNote: FILLS_DEFAULTS,
        fields: [
            {
                key: 'alg',
                label: 'Algorithm',
                kind: 'select',
                options: JWT_ALGORITHMS.filter(({ value }) => !value.startsWith('HS')),
                info: 'The signing algorithm the key is for.',
            },
            {
                key: 'iss',
                label: 'Issuer',
                placeholder: 'e.g. my-service',
                info: 'The service sending the request.',
            },
            {
                key: 'aud',
                label: 'Audience',
                placeholder: 'e.g. their-service',
                info: 'The service receiving the request.',
            },
            {
                key: 'kid',
                label: 'Key ID',
                placeholder: 'e.g. my-service/key-1',
                info: 'Names the public key the receiver checks the signature with.',
            },
            {
                key: 'privateKey',
                label: 'Private key',
                kind: 'key',
                placeholder: PRIVATE_KEY_PLACEHOLDER,
            },
            {
                key: 'sub',
                label: 'Subject',
                placeholder: 'Defaults to the issuer',
                advanced: true,
            },
            {
                key: 'claims',
                label: 'Additional claims',
                kind: 'code',
                advanced: true,
                info: 'More claims, as a JSON object.',
            },
            {
                key: 'exp',
                label: 'Expiry',
                placeholder: 'e.g. 1h',
                advanced: true,
                info: 'How long the token is valid: seconds, or a number with s, m, h or d.',
            },
        ],
        defaults: {
            alg: 'RS256',
            iss: '',
            aud: '',
            kid: '',
            privateKey: '',
            exp: '1h',
        },
    },
    {
        type: 'awsv4',
        label: 'AWS Signature',
        icon: Cloud,
        note: GENERATED_HEADER,
        advancedNote: FILLS_DEFAULTS,
        fields: [
            {
                key: 'addAuthDataToQuery',
                label: 'Add authorization data to',
                kind: 'select',
                side: true,
                options: [
                    {
                        value: 'false',
                        label: 'Request Headers',
                    },
                    {
                        value: 'true',
                        label: 'Request URL',
                    },
                ],
            },
            {
                key: 'accessKey',
                label: 'AccessKey',
                placeholder: 'AccessKey',
            },
            {
                key: 'secretKey',
                label: 'SecretKey',
                placeholder: 'SecretKey',
            },
            {
                key: 'region',
                label: 'AWS Region',
                placeholder: 'e.g. us-east-1',
                advanced: true,
                info: 'The region of the service.',
            },
            {
                key: 'service',
                label: 'Service Name',
                placeholder: 'e.g. s3',
                advanced: true,
                info: 'The service being called, such as s3, execute-api or es.',
            },
            {
                key: 'sessionToken',
                label: 'Session Token',
                placeholder: 'Session Token',
                advanced: true,
                info: 'Only for temporary credentials.',
            },
        ],
        defaults: {
            accessKey: '',
            secretKey: '',
            addAuthDataToQuery: false,
        },
    },
    {
        type: 'ntlm',
        label: 'NTLM Authentication',
        icon: Building2,
        note: GENERATED_HEADER,
        sideNote: () =>
            'Kynova answers the server’s NTLM challenge on the same connection, as NTLM requires.',
        fields: [
            {
                key: 'disableRetryRequest',
                label: 'Yes, disable retrying the request',
                kind: 'check',
                side: true,
            },
            {
                key: 'username',
                label: 'Username',
                placeholder: 'Username',
            },
            {
                key: 'password',
                label: 'Password',
                placeholder: 'Password',
            },
            {
                key: 'domain',
                label: 'Domain',
                placeholder: 'e.g. example.com',
                advanced: true,
            },
            {
                key: 'workstation',
                label: 'Workstation',
                placeholder: 'e.g. my-pc',
                advanced: true,
            },
        ],
        defaults: {
            username: '',
            password: '',
        },
    },
    {
        type: 'none',
        label: 'No Auth',
        icon: ShieldOff,
        startsGroup: true,
        note: null,
        fields: [],
        defaults: {},
    },
]

export function authTypeOf(type: Auth['type']): AuthType {
    return AUTH_TYPES.find((entry) => entry.type === type) ?? AUTH_TYPES[AUTH_TYPES.length - 1]
}

/** The settings of any auth, as one flat record: the first three types keep their own fields. */
export function authValues(auth: Auth): AuthValues {
    if ('values' in auth) {
        return auth.values
    }

    const { type: _type, ...fields } = auth

    return fields as AuthValues
}

export function withAuthValues(auth: Auth, values: AuthValues): Auth {
    return (
        'values' in auth
            ? {
                  ...auth,
                  values,
              }
            : {
                  ...auth,
                  ...values,
              }
    ) as Auth
}

/** A fresh auth of the given type, with its defaults. */
export function emptyAuth(type: Auth['type']): Auth {
    const { defaults } = authTypeOf(type)

    if (type === 'none' || type === 'bearer' || type === 'basic' || type === 'apikey') {
        return {
            type,
            ...defaults,
        } as Auth
    }

    return {
        type,
        values: { ...defaults },
    }
}
