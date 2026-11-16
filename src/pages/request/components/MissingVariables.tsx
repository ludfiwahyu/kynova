import { useMissingVariables } from '@/pages/request/hooks/useMissingVariables'
import type { MissingVariablesProps } from '@/pages/request/types'

export function MissingVariables(props: MissingVariablesProps) {
    const missing = useMissingVariables(props)

    if (missing.isEmpty) {
        return null
    }

    return <p className="url-warning">{missing.text}</p>
}
