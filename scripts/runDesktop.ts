import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'

import { DEFAULT_PORT } from '#shared/ports.ts'

const electron: string = createRequire(import.meta.url)('electron')
const { ELECTRON_RUN_AS_NODE: _, ...env } = process.env

// `--dev` shows the Vite dev server in the window, so edits appear as they are saved.
if (process.argv.includes('--dev')) {
    env.KYNOVA_DEV_URL = `http://localhost:${env.PORT || DEFAULT_PORT}`
}

const child = spawn(electron, ['.'], {
    stdio: 'inherit',
    env,
})

child.on('exit', (code) => process.exit(code ?? 0))
