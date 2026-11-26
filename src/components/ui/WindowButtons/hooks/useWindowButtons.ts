import { useEffect, useState } from 'react'

import type { WindowAction } from '#shared/desktop.ts'

export function useWindowButtons() {
    const desktop = window.kynovaDesktop
    const [isMaximized, setIsMaximized] = useState(false)

    useEffect(() => desktop?.onMaximized(setIsMaximized), [desktop])

    function run(action: WindowAction) {
        desktop?.windowAction(action)
    }

    return {
        isShown: desktop?.platform === 'windows',
        isMaximized,
        maximizeLabel: isMaximized ? 'Restore' : 'Maximize',
        minimize: () => run('minimize'),
        toggleMaximize: () => run('toggleMaximize'),
        close: () => run('close'),
    }
}
