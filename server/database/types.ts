export type SqlValue = string | number | null

export type Row = Record<string, unknown>

export interface Queryable {
    /** Every matching row. */
    all<T = Row>(sql: string, params?: SqlValue[]): Promise<T[]>
    /** The first matching row, or `undefined`. */
    get<T = Row>(sql: string, params?: SqlValue[]): Promise<T | undefined>
    /** Runs an INSERT, UPDATE or DELETE and reports how many rows it changed. */
    run(sql: string, params?: SqlValue[]): Promise<{ changes: number }>
    /** Runs one or more statements without parameters, such as a schema change. */
    exec(sql: string): Promise<void>
}

export interface Database extends Queryable {
    readonly engine: 'sqlite' | 'postgres' | 'mysql'
    /**
     * Runs `work` atomically: every statement through `tx` commits, or none do.
     * Inside `work`, use only `tx` and await only database calls.
     */
    transaction<T>(work: (tx: Queryable) => Promise<T>): Promise<T>
    /**
     * Tells every Kynova server on this database about a change (PostgreSQL
     * NOTIFY). A SQLite file has one server, so its adapter has nobody to tell.
     */
    notify(payload: string): Promise<void>
    /** Calls `handler` with what other servers `notify`. */
    onNotify(handler: (payload: string) => void): void
    close(): Promise<void>
}
