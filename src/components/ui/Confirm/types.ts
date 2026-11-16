export interface Confirmation {
    title: string
    message: string
    action: string
    resolve: (confirmed: boolean) => void
}

export interface ConfirmState {
    current: Confirmation | null
}
