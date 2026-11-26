import { Copy, Minus, Square, X } from 'lucide-react'

import { Button } from '@/components/ui/Button/Button'
import { useWindowButtons } from '@/components/ui/WindowButtons/hooks/useWindowButtons'
import { WINDOW_ICON_SIZE, WINDOW_ICON_STROKE } from '@/components/ui/WindowButtons/logic/config'

/** Minimize, maximize and close for the desktop window on Windows and Linux; nothing elsewhere. */
export function WindowButtons() {
    const buttons = useWindowButtons()
    const icon = {
        size: WINDOW_ICON_SIZE,
        strokeWidth: WINDOW_ICON_STROKE,
    }

    if (!buttons.isShown) {
        return null
    }

    return (
        <div className="window-buttons">
            <Button
                variant="plain"
                className="window-button"
                tabIndex={-1}
                aria-label="Minimize"
                title="Minimize"
                icon={<Minus {...icon} />}
                onClick={buttons.minimize}
            />

            <Button
                variant="plain"
                className="window-button"
                tabIndex={-1}
                aria-label={buttons.maximizeLabel}
                title={buttons.maximizeLabel}
                icon={buttons.isMaximized ? <Copy {...icon} /> : <Square {...icon} />}
                onClick={buttons.toggleMaximize}
            />

            <Button
                variant="plain"
                className="window-button"
                data-close
                tabIndex={-1}
                aria-label="Close window"
                title="Close"
                icon={<X {...icon} />}
                onClick={buttons.close}
            />
        </div>
    )
}
