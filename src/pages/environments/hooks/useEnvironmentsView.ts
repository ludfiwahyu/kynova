import { newEnvironment } from '@/pages/environments/logic/helpers'
import { useCanEdit } from '@/stores'

export function useEnvironmentsView() {
    const canEdit = useCanEdit()

    return {
        canEdit,
        create: newEnvironment,
    }
}
