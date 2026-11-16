export interface NameDialogProps {
    title: string
    label: string
    initialName?: string
    action: string
    onSubmit: (name: string) => Promise<void>
    onClose: () => void
}
