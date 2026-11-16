/** The version in package.json, filled in by Vite at build time. */
declare const __APP_VERSION__: string

/** Where the app runs: set by VITE_APP_APPLICATION, or by the desktop build modes. */
declare const __APP_PLATFORM__: 'WEB' | 'WIN' | 'MAC'
