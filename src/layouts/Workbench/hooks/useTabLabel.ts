import type { TabLabel } from '@/layouts/Workbench/types'
import { type Tab, useActiveWorkspace, useWorkspace } from '@/stores'

export function useTabLabel(tab: Tab): TabLabel | null {
    const item = useWorkspace((state) => (tab.kind === 'item' ? state.items[tab.id] : undefined))
    const environment = useWorkspace((state) =>
        tab.kind === 'environment' ? state.environments[tab.id] : undefined,
    )
    const workspace = useActiveWorkspace()

    if (item) {
        return {
            name: item.name,
            kind: 'item',
            item,
        }
    }

    if (environment) {
        return {
            name: environment.name,
            kind: 'environment',
            environment,
        }
    }

    if (tab.kind === 'workspace' && workspace) {
        return {
            name: workspace.name,
            kind: 'workspace',
        }
    }

    return null
}
