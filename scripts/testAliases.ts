import { existsSync, statSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SRC = fileURLToPath(new URL('../src/', import.meta.url))

const SUFFIXES = ['', '.ts', '.tsx', '/index.ts', '/index.tsx']

function isFile(path: string) {
    return existsSync(path) && statSync(path).isFile()
}

function findFile(base: string) {
    return SUFFIXES.map((suffix) => base + suffix).find(isFile)
}

// Vite fills this in at build time; tests run without Vite.
Object.assign(globalThis, { __APP_PLATFORM__: 'WEB' })

registerHooks({
    resolve(specifier, context, nextResolve) {
        const isAlias = specifier.startsWith('@/')
        const isRelative = specifier.startsWith('./') || specifier.startsWith('../')

        // Only src/ writes imports without an extension; packages keep Node's own rules.
        const importerIsSrc = context.parentURL?.startsWith(pathToFileURL(SRC).href)

        if (!isAlias && !(isRelative && importerIsSrc)) {
            return nextResolve(specifier, context)
        }

        const base = isAlias
            ? SRC + specifier.slice(2)
            : fileURLToPath(new URL(specifier, context.parentURL))

        const file = findFile(base)

        if (!file) {
            return nextResolve(specifier, context)
        }

        return nextResolve(pathToFileURL(file).href, context)
    },
})
