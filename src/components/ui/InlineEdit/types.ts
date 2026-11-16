export interface InlineEditProps {
    value: string
    onSave: (value: string) => void
    onCancel: () => void
    label: string
}

export interface InlineEditOptions {
    value: string
    onSave: (value: string) => void
    onCancel: () => void
}
