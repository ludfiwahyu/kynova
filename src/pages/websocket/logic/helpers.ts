export function connectLabelOf(isClosed: boolean, isOpen: boolean): string {
    if (isClosed) {
        return 'Connect'
    }

    return isOpen ? 'Disconnect' : 'Cancel'
}
