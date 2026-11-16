import type { AuthValues, SignedAuthType } from './types.ts'

export const SIGNED_AUTH_TYPES: SignedAuthType[] = [
    'digest',
    'hawk',
    'jwt',
    'oauth1',
    'edgegrid',
    'asap',
    'awsv4',
    'ntlm',
]

export function isSignedAuthType(type: unknown): type is SignedAuthType {
    return SIGNED_AUTH_TYPES.includes(type as SignedAuthType)
}

/** A setting as text. Collection files sometimes hold numbers, and absent settings read as empty. */
export function textValue(values: AuthValues, key: string, fallback = ''): string {
    const value = values[key]

    if (typeof value === 'string') {
        return value || fallback
    }

    if (typeof value === 'number') {
        return String(value)
    }

    return fallback
}

/** A yes-or-no setting. Collection files hold booleans, or occasionally "true" and "false". */
export function flagValue(values: AuthValues, key: string, fallback = false): boolean {
    const value = values[key]

    if (typeof value === 'boolean') {
        return value
    }

    if (value === 'true' || value === 'false') {
        return value === 'true'
    }

    return fallback
}
