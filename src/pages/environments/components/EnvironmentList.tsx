import { Plus } from 'lucide-react'

import { Button, EmptyState } from '@/components'
import { EnvironmentRow } from '@/pages/environments/components/EnvironmentRow'
import { useEnvironmentList } from '@/pages/environments/hooks/useEnvironmentList'
import { ACTIONS_ICON_SIZE } from '@/pages/environments/logic/config'

export function EnvironmentList() {
    const list = useEnvironmentList()

    return (
        <div className="environment-list">
            {list.isEmpty ? (
                <EmptyState
                    title="No environments yet"
                    action={
                        list.canEdit && (
                            <Button
                                icon={<Plus size={ACTIONS_ICON_SIZE} />}
                                onClick={list.create}
                            >
                                New environment
                            </Button>
                        )
                    }
                >
                    An environment is a set of variables, like a base URL or a token. Write{' '}
                    <code>{'{{name}}'}</code> in a request to use one.
                </EmptyState>
            ) : (
                <div
                    className="tree"
                    role="tree"
                    aria-label="Environments"
                >
                    {list.environments.map((environment) => (
                        <EnvironmentRow
                            key={environment.id}
                            environment={environment}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
