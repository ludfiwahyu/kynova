import { ChevronRight } from 'lucide-react'

import { Button, KeyValueTable, ScopeBadge } from '@/components'
import { VariableRow } from '@/pages/environments/components/VariableRow'
import { useVariablesPanel } from '@/pages/environments/hooks/useVariablesPanel'
import type { VariablesPanelProps } from '@/pages/environments/types'

export function VariablesPanel(props: VariablesPanelProps) {
    const panel = useVariablesPanel(props)

    return (
        <div className="panel-scroll variables-panel">
            {panel.isRequest && (
                <section className="variables-section">
                    <h3 className="variables-heading">Variables in request</h3>

                    {panel.used.length === 0 && (
                        <p className="muted">
                            This request uses no variables. Write <code>{'{{name}}'}</code> in it to
                            use one.
                        </p>
                    )}

                    {panel.used.map((variable) => (
                        <VariableRow
                            key={variable.name}
                            name={variable.name}
                            value={variable.value}
                            scope={variable.scope}
                            disabled={!panel.canEdit}
                            onCommit={(value) => panel.setValue(variable.name, value)}
                        />
                    ))}
                </section>
            )}

            <section className="variables-section">
                <Button
                    variant="plain"
                    className="variables-fold"
                    aria-expanded={panel.showAll}
                    icon={<ChevronRight size={14} />}
                    onClick={panel.toggleAll}
                >
                    All variables
                </Button>

                {panel.showAll && (
                    <div className="variables-groups">
                        <div className="variables-group">
                            {panel.environment ? (
                                <>
                                    <h3 className="variables-group-title">
                                        <ScopeBadge scope="environment" />
                                        <span className="truncate">{panel.environment.name}</span>
                                    </h3>

                                    <KeyValueTable
                                        rows={panel.environment.variables}
                                        disabled={!panel.canEdit}
                                        description={false}
                                        variables={panel.variables}
                                        addLabel="Add variable"
                                        onChange={panel.changeEnvironment}
                                    />
                                </>
                            ) : (
                                <p className="muted">
                                    No environment is selected. Choose one next to the tabs.
                                </p>
                            )}
                        </div>

                        <div className="variables-group">
                            {panel.collection ? (
                                <>
                                    <h3 className="variables-group-title">
                                        <ScopeBadge scope="collection" />
                                        <span className="truncate">{panel.collection.name}</span>
                                    </h3>

                                    <KeyValueTable
                                        rows={panel.collection.variables ?? []}
                                        disabled={!panel.canEdit}
                                        description={false}
                                        variables={panel.variables}
                                        onChange={panel.changeCollection}
                                    />
                                </>
                            ) : (
                                <p className="muted">
                                    Open a request to edit its collection&apos;s variables.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </section>
        </div>
    )
}
