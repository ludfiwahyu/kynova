import { CircleCheck } from 'lucide-react'

import { Button, EnvironmentGlyph, Input, KeyValueTable } from '@/components'
import { useEnvironmentView } from '@/pages/environments/hooks/useEnvironmentView'
import { BADGE_ICON_SIZE } from '@/pages/environments/logic/config'
import type { EnvironmentViewProps } from '@/pages/environments/types'
import { MAX_NAME_LENGTH } from '#shared/limits.ts'

export function EnvironmentView({ environment }: EnvironmentViewProps) {
    const view = useEnvironmentView(environment)

    return (
        <div
            className="document-view"
            onInputCapture={view.keepOpen}
        >
            <header className="item-header">
                <EnvironmentGlyph color={environment.color} />

                <Input
                    variant="plain"
                    className="item-name"
                    ref={view.nameRef}
                    aria-label="Environment name"
                    maxLength={MAX_NAME_LENGTH}
                    value={view.nameDraft}
                    size={view.nameSize}
                    disabled={!view.canEdit}
                    onValueChange={view.setNameDraft}
                    onBlur={view.saveName}
                    onKeyDown={view.handleNameKeyDown}
                />

                {view.isActive && (
                    <span className="badge">
                        <CircleCheck size={BADGE_ICON_SIZE} /> Active
                    </span>
                )}

                <span className="grow" />

                <Button
                    variant={view.toggleVariant}
                    onClick={view.toggleActive}
                >
                    {view.toggleLabel}
                </Button>
            </header>

            <div className="document-body">
                <p className="muted document-intro">
                    Write <code>{'{{name}}'}</code> in a URL, header, param or body to use a
                    variable. An environment&apos;s value wins over a collection variable of the
                    same name. Values are shared with every workspace member.
                </p>

                <KeyValueTable
                    rows={environment.variables}
                    onChange={view.changeVariables}
                    disabled={!view.canEdit}
                    variables={view.variables}
                    keyLabel="Variable"
                />
            </div>
        </div>
    )
}
