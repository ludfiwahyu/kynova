import { cpSync, rmSync } from 'node:fs'

import { build } from 'esbuild'

import { ENGINES } from '#server/database/migrations/index.ts'

const OUT = 'dist-desktop'

rmSync(OUT, {
    recursive: true,
    force: true,
})

await build({
    entryPoints: ['electron/main.ts'],
    outfile: `${OUT}/main.cjs`,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node24',
    external: ['electron'],
})

// Sandboxed: it may only require electron, so everything else is bundled in.
await build({
    entryPoints: ['electron/preload.ts'],
    outfile: `${OUT}/preload.cjs`,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node24',
    external: ['electron'],
})

await build({
    entryPoints: ['server/index.ts'],
    outfile: `${OUT}/server/index.mjs`,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node24',
    // Optional native add-ons the dependencies try first and do without.
    external: ['pg-native', 'bufferutil', 'utf-8-validate'],
    // Some dependencies are CommonJS and call require().
    banner: {
        js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
    },
})

// The migrations folder sits next to the code that reads it (`new URL('.', import.meta.url)`).
for (const engine of ENGINES) {
    cpSync(`server/database/migrations/${engine}`, `${OUT}/server/${engine}`, { recursive: true })
}

console.log(`Built ${OUT}/`)
