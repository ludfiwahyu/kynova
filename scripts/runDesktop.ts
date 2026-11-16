import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'

const electron: string = createRequire(import.meta.url)('electron')
const { ELECTRON_RUN_AS_NODE: _, ...env } = process.env

const child = spawn(electron, ['.'], {
    stdio: 'inherit',
    env,
})

child.on('exit', (code) => process.exit(code ?? 0))
