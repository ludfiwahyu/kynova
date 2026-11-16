export interface TabDefinition<T extends string> {
    id: T
    label: string
    count?: number
    dot?: boolean
}

export interface TabsProps<T extends string> {
    tabs: readonly TabDefinition<T>[]
    active: T
    onChange: (id: T) => void
    label?: string
}
