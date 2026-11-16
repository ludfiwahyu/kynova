import type { SslMode } from '#shared/databaseUrl.ts'

export const SSL_OPTIONS: {
    value: SslMode
    label: string
    hint: string
}[] = [
    {
        value: 'verify',
        label: 'Verify certificate',
        hint: 'Encrypted, and the server proves who it is',
    },
    {
        value: 'require',
        label: 'Require, without verifying',
        hint: 'Encrypted, but open to an impostor on the network',
    },
    {
        value: 'off',
        label: 'Off',
        hint: 'Only for a database on this machine or a trusted network',
    },
]

export const KIND_NAME = {
    local: 'Local',
    postgres: 'PostgreSQL',
    supabase: 'Supabase',
} as const

export const STATUS_ICON_SIZE = 14

export const SETTINGS_ICON_SIZE = 16

export const CHOICE_ICON_SIZE = 18

export const SMALL_ICON_SIZE = 13

export const NOTE_ICON_SIZE = 14

export const EYE_ICON_SIZE = 15

export const URL_PLACEHOLDER =
    'postgresql://postgres.ref:password@aws-0-region.pooler.supabase.com:5432/postgres'

export const CA_PLACEHOLDER = '-----BEGIN CERTIFICATE-----'

export const DB_CHOICES = [
    {
        id: 'local',
        title: 'Local database',
        text: 'Kept by this Kynova server. Collaborate with others who sign in here.',
    },
    {
        id: 'external',
        title: 'My own database',
        text: 'Supabase or PostgreSQL. Everyone who connects to it shares its accounts and workspaces.',
    },
] as const

export const HINTS = {
    supabaseUrl: 'From Supabase: Connect › Session pooler (port 5432), or the direct connection.',
    plainUrl: 'The password is kept on this Kynova server, never in the browser.',
    supabaseCa:
        'Supabase signs with its own CA: download it from Database settings › SSL Configuration and paste it here.',
    plainCa: 'Needed only when the server’s certificate is not signed by a public authority.',
}

export const LABELS = {
    test: 'Test connection',
    testing: 'Connecting…',
    use: 'Use this database',
    using: 'Preparing the database…',
}

export const SIGN_IN_NOTE = 'Sign in or create an account there.'
