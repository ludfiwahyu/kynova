import type { SelectOption } from '@/components'
import { NO_ENVIRONMENT } from '@/pages/environments/logic/config'
import type { Environment } from '#shared/types.ts'

export function toEnvironmentOptions(environments: Environment[]): SelectOption<string>[] {
    return [
        NO_ENVIRONMENT,
        ...environments.map((environment) => ({
            value: environment.id,
            label: environment.name,
        })),
    ]
}
