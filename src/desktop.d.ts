import type { KynovaDesktop } from '#shared/desktop.ts'

declare global {
    interface Window {
        /** The desktop app's bridge, from its preload. Absent in a browser. */
        kynovaDesktop?: KynovaDesktop
    }
}
