import { useEffect, useRef } from 'react'

import type { ShortcutId } from '@/settings'
import { matchesShortcut } from '@/settings'

/**
 * Runs `handler` when the shortcut is pressed anywhere in the window, and keeps the
 * browser from doing its own thing with those keys. Off while `enabled` is false.
 *
 * It listens in the capture phase, so it runs before the page's own fields and before
 * the browser's default: ⌘K or Ctrl+K opens Kynova's search, not the browser's.
 * Browsers keep a few keys whatever a page does (⌘W, ⌘T, ⌘N, ⌘Q; Ctrl+W, Ctrl+T, Ctrl+N).
 */
export function useShortcut(id: ShortcutId, handler: () => void, enabled = true): void {
    const latest = useRef(handler)

    latest.current = handler

    useEffect(() => {
        if (!enabled) {
            return
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (!matchesShortcut(event, id)) {
                return
            }

            event.preventDefault()
            latest.current()
        }

        window.addEventListener('keydown', onKeyDown, { capture: true })

        return () => window.removeEventListener('keydown', onKeyDown, { capture: true })
    }, [id, enabled])
}
