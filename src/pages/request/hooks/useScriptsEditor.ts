import { useState } from 'react'

import { PHASES } from '@/pages/request/logic/config'
import { toPhaseTabs } from '@/pages/request/logic/mappers'
import type { Phase, ScriptsEditorProps } from '@/pages/request/types'

export function useScriptsEditor({ scripts, onChange }: ScriptsEditorProps) {
    const [phase, setPhase] = useState<Phase>(
        scripts?.preRequest && !scripts.test ? 'preRequest' : 'test',
    )

    const tabs = toPhaseTabs(scripts)
    const current = PHASES.find(({ id }) => id === phase)!
    const value = scripts?.[phase] ?? ''
    const editorLabel = `${current.label} script`

    function change(text: string) {
        onChange({
            ...scripts,
            [phase]: text,
        })
    }

    return {
        phase,
        tabs,
        value,
        editorLabel,
        placeholder: current.placeholder,
        setPhase,
        change,
    }
}
