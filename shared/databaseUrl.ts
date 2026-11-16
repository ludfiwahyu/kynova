/** Reading PostgreSQL connection strings, for the database picker and the database scripts. */

export type SslMode = 'verify' | 'require' | 'off'

export function isSupabaseHost(host: string): boolean {
    return /(^|\.)supabase\.(co|com)$/i.test(host)
}

/**
 * The SSL choice a connection string implies: its `sslmode`, else Verify for
 * Supabase (which requires SSL) and Off for other servers, as libpq would try.
 */
export function inferSslMode(connectionString: string): SslMode {
    let url: URL

    try {
        url = new URL(connectionString.trim())
    } catch {
        return 'verify'
    }

    const mode = url.searchParams.get('sslmode')

    if (mode === 'disable') {
        return 'off'
    }

    if (mode === 'verify-ca' || mode === 'verify-full') {
        return 'verify'
    }

    if (mode === 'require' || mode === 'prefer' || mode === 'allow') {
        return 'require'
    }

    return isSupabaseHost(url.hostname) ? 'verify' : 'off'
}
