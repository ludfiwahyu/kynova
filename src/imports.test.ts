import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { basename, join, relative } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const SRC = fileURLToPath(new URL('.', import.meta.url))
const SERVER = fileURLToPath(new URL('../server', import.meta.url))

function codeFiles(folder: string): string[] {
    return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
        const path = join(folder, entry.name)

        if (entry.isDirectory()) {
            return codeFiles(path)
        }

        return /\.tsx?$/.test(entry.name) ? [path] : []
    })
}

test('no import climbs out of its folder with ../', () => {
    const offenders = [...codeFiles(SRC), ...codeFiles(SERVER)].filter((file) =>
        /(from\s+|import\s*\(\s*)['"]\.\.\//.test(readFileSync(file, 'utf8')),
    )

    assert.deepEqual(offenders, [])
})

test('class names joined in a template keep their space outside the ${...}', () => {
    // Prettier's Tailwind plugin trims the spaces at the ends of a class string, so
    // `a${on ? ' b' : ''}` becomes `ab`. Write `a ${on ? 'b' : ''}` instead.
    const offenders = codeFiles(SRC).filter((file) =>
        /className=\{`[^`]*\$\{[^}]*\?\s*'\s/.test(readFileSync(file, 'utf8')),
    )

    assert.deepEqual(offenders, [])
})

test('code outside components/ imports components through the barrel only', () => {
    const offenders = codeFiles(SRC).filter((file) => {
        const inComponents = file.startsWith(join(SRC, 'components'))

        return !inComponents && /from\s+'@\/components\//.test(readFileSync(file, 'utf8'))
    })

    assert.deepEqual(offenders, [])
})

test('index files sit only at the top of a src/ folder, or at the top of a page', () => {
    const offenders = codeFiles(SRC)
        .filter((file) => /^index\.tsx?$/.test(basename(file)))
        .map((file) => relative(SRC, file))
        .filter(
            (file) =>
                !/^[^/]+\/index\.tsx?$/.test(file) && !/^pages\/[^/]+\/index\.tsx?$/.test(file),
        )

    assert.deepEqual(offenders, [])
})

test('components/shared is used by components/ui only, and never imports from ui', () => {
    const offenders = codeFiles(SRC).filter((file) => {
        const source = readFileSync(file, 'utf8')
        const inUi = file.startsWith(join(SRC, 'components', 'ui'))
        const inShared = file.startsWith(join(SRC, 'components', 'shared'))

        if (inShared) {
            return /from\s+'@\/components\/ui\//.test(source)
        }

        return !inUi && /from\s+'@\/components\/shared\//.test(source)
    })

    assert.deepEqual(offenders, [])
})
