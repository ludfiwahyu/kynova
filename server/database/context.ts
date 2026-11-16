import { AsyncLocalStorage } from 'node:async_hooks'

import type { Database } from './types.ts'

export type TargetKind = 'local' | 'postgres' | 'supabase'

/** A database people can sign in to, as the app shows it. Never holds the password. */
export interface TargetStatus {
    /** `local` for the server's own database; otherwise derived from the connection details. */
    id: string
    kind: TargetKind
    /** "Local database", "Supabase" or "PostgreSQL". */
    label: string
    /** Where it is: "SQLite on this server", a Supabase project, or host and database name. */
    detail: string
}

export interface Target extends TargetStatus {
    db: Database
}

const storage = new AsyncLocalStorage<Target>()

export function runIn<T>(target: Target, work: () => T): T {
    return storage.run(target, work)
}

export function currentTarget(): Target {
    const target = storage.getStore()

    if (!target) {
        throw new Error('This work is not running for any database (see database/context.ts).')
    }

    return target
}

export function statusOf({ id, kind, label, detail }: Target): TargetStatus {
    return {
        id,
        kind,
        label,
        detail,
    }
}

/** The database of the work in progress. Every call goes to `currentTarget().db`. */
export const db: Database = new Proxy({} as Database, {
    get(_, property) {
        const database = currentTarget().db
        const value = database[property as keyof Database]

        return typeof value === 'function' ? value.bind(database) : value
    },
})
