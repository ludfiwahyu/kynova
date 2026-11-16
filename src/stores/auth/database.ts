import { create } from 'zustand'

import { api, type DatabaseInput, type DatabaseStatus } from '@/services'

import { useSession } from './session'

/** Databases used before in this browser, newest first: names only, never passwords. */
const RECENT_KEY = 'kynova.recentDatabases'
const MAX_RECENT = 6

interface DatabaseState {
    current: DatabaseStatus | null
    /** Why the current database cannot be reached, if it cannot. */
    error: string | null
    recent: DatabaseStatus[]
}

function readRecent(): DatabaseStatus[] {
    try {
        const recent = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')

        return Array.isArray(recent) ? recent : []
    } catch {
        return []
    }
}

export const useDatabase = create<DatabaseState>(() => ({
    current: null,
    error: null,
    recent: readRecent(),
}))

function remember(database: DatabaseStatus): void {
    if (database.kind === 'local') {
        return
    }

    const recent = [
        database,
        ...useDatabase.getState().recent.filter(({ id }) => id !== database.id),
    ].slice(0, MAX_RECENT)

    try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(recent))
    } catch {
        // Storage may be unavailable; the list is a convenience.
    }

    useDatabase.setState({ recent })
}

export function forgetRecent(id: string): void {
    const recent = useDatabase.getState().recent.filter((database) => database.id !== id)

    localStorage.setItem(RECENT_KEY, JSON.stringify(recent))
    useDatabase.setState({ recent })
}

export async function loadDatabase(): Promise<void> {
    const { database, error } = await api.database()

    useDatabase.setState({
        current: database,
        error: error ?? null,
    })
}

/** Switches to a database. The server signs this browser out of the one it leaves. */
export async function switchDatabase(
    choice: { local: true } | { id: string } | DatabaseInput,
): Promise<DatabaseStatus> {
    const { database } = await api.useDatabase(choice)

    remember(database)
    useDatabase.setState({
        current: database,
        error: null,
    })
    useSession.setState({
        status: 'signedOut',
        user: null,
        workspaces: [],
        activeWorkspaceId: null,
    })

    return database
}
