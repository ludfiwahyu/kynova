import { Download } from 'lucide-react'

import { Button, KeyValueTable, Tabs, VariableContext } from '@/components'
import { DescriptionEditor } from '@/pages/container/components/DescriptionEditor'
import { useContainerView } from '@/pages/container/hooks/useContainerView'
import { ICON_SIZE } from '@/pages/container/logic/config'
import type { ContainerViewProps } from '@/pages/container/types'
import { ItemHeader, ScriptsEditor } from '@/pages/request'

export function ContainerView({ item }: ContainerViewProps) {
    const view = useContainerView(item)

    return (
        <VariableContext.Provider value={view.variableContext}>
            <div
                className="document-view"
                onInputCapture={view.keepOpen}
            >
                <ItemHeader item={item} />

                <div className="document-toolbar">
                    <Tabs
                        label={view.tabsLabel}
                        tabs={view.tabs}
                        active={view.section}
                        onChange={view.setSection}
                    />

                    <span className="grow" />
                    <span className="muted document-counts">{view.countsLabel}</span>

                    {view.isCollection && (
                        <Button
                            icon={<Download size={ICON_SIZE} />}
                            onClick={view.exportFile}
                        >
                            Export
                        </Button>
                    )}
                </div>

                <div
                    ref={view.bodyRef}
                    className="document-body"
                >
                    {view.section === 'overview' && (
                        <DescriptionEditor
                            description={item.description}
                            canEdit={view.canEdit}
                            subject={item.kind}
                            onChange={view.changeDescription}
                        />
                    )}

                    {view.section === 'variables' && view.isCollection && (
                        <>
                            <p className="muted document-intro">
                                Collection variables fill <code>{'{{name}}'}</code> in this
                                collection&apos;s requests when the active environment does not set
                                the same name.
                            </p>

                            <KeyValueTable
                                rows={view.collectionVariables}
                                disabled={!view.canEdit}
                                variables={view.variables}
                                keyLabel="Variable"
                                onChange={view.changeVariables}
                            />
                        </>
                    )}

                    {view.section === 'scripts' && (
                        <ScriptsEditor
                            scripts={item.scripts}
                            disabled={!view.canEdit}
                            onChange={view.changeScripts}
                        />
                    )}
                </div>
            </div>
        </VariableContext.Provider>
    )
}
