import { confirm } from '@/components'
import { createEnvironment, deleteEnvironment, editNameSoon, openTab } from '@/stores'
import { downloadText } from '@/utils'
import type { Environment } from '#shared/types.ts'

export function newEnvironment(): void {
    const environment = createEnvironment()

    editNameSoon(environment.id)
    openTab({
        kind: 'environment',
        id: environment.id,
    })
}

export async function confirmDelete(environment: Environment) {
    const confirmed = await confirm({
        title: `Delete ${environment.name}?`,
        message:
            'Its variables are deleted for every member of the workspace. This cannot be undone.',
        action: 'Delete environment',
    })

    if (confirmed) {
        deleteEnvironment(environment.id)
    }
}

/** Saves the environment's name and variables as a JSON file. */
export function exportEnvironment(environment: Environment): void {
    const { name, variables } = environment

    downloadText(
        `${name}.environment.json`,
        JSON.stringify(
            {
                name,
                variables,
            },
            null,
            2,
        ),
    )
}

export function sortedByName(environments: Record<string, Environment>): Environment[] {
    return Object.values(environments).sort((a, b) => a.name.localeCompare(b.name))
}
