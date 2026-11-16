import { Pencil } from 'lucide-react'

import { Button, Markdown, TextArea } from '@/components'
import { useDescriptionEditor } from '@/pages/container/hooks/useDescriptionEditor'
import { DESCRIPTION_PLACEHOLDER, ICON_SIZE } from '@/pages/container/logic/config'
import type { DescriptionEditorProps } from '@/pages/container/types'

export function DescriptionEditor(props: DescriptionEditorProps) {
    const { onChange, canEdit, subject } = props
    const editor = useDescriptionEditor(props)

    return (
        <div className="description">
            {editor.mode === 'edit' && (
                <div className="description-editor">
                    <TextArea
                        aria-label={`Description of this ${subject}`}
                        autoFocus
                        rows={editor.rows}
                        placeholder={DESCRIPTION_PLACEHOLDER}
                        value={editor.text}
                        onValueChange={onChange}
                    />

                    <div className="row">
                        <span className="muted grow">
                            Markdown is supported. Changes save as you type.
                        </span>

                        <Button onClick={editor.stopEditing}>Done</Button>
                    </div>
                </div>
            )}

            {editor.mode === 'empty' && (
                <div className="description-empty">
                    <p className="muted">This {subject} has no description yet.</p>

                    {canEdit && (
                        <Button
                            variant="link"
                            onClick={editor.startEditing}
                        >
                            Add a description
                        </Button>
                    )}
                </div>
            )}

            {editor.mode === 'view' && (
                <div className="description-view">
                    {canEdit && (
                        <Button
                            variant="icon"
                            className="description-edit"
                            icon={<Pencil size={ICON_SIZE} />}
                            aria-label="Edit description"
                            title="Edit"
                            onClick={editor.startEditing}
                        />
                    )}

                    <Markdown source={editor.text} />
                </div>
            )}
        </div>
    )
}
