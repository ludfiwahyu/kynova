export type ConfirmAnswer = 'action' | 'alternative' | 'cancel'

export interface Confirmation {
    title: string
    message: string
    action: string
    /** A second way to go ahead, beside the action and Cancel. */
    alternative?: string
    resolve: (answer: ConfirmAnswer) => void
}

export interface ConfirmState {
    current: Confirmation | null
}
