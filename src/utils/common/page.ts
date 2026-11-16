export interface PageTab<Id extends string = string> {
    id: Id
    label: string
}

export interface PageConfig<Id extends string = string> {
    id: string
    title: string
    description: string
    tabs: readonly PageTab<Id>[]
}

/** Checks a page config's shape and keeps its tab ids exact, for `TabId<typeof page>`. */
export function definePage<const Id extends string>(config: PageConfig<Id>): PageConfig<Id> {
    return config
}

/** The tab ids of a page config, as a type: `'params' | 'auth' | ...`. */
export type TabId<Page> = Page extends PageConfig<infer Id> ? Id : never
