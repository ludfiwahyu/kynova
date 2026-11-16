import assert from 'node:assert/strict'
import { test } from 'node:test'

import { keysFor, matchesShortcut, type Shortcut, shortcutGroups, SHORTCUTS } from './shortcuts'

const press = (
    key: string,
    code: string,
    modifiers: Partial<Record<'meta' | 'ctrl' | 'alt' | 'shift', boolean>> = {},
) => ({
    key,
    code,
    metaKey: !!modifiers.meta,
    ctrlKey: !!modifiers.ctrl,
    altKey: !!modifiers.alt,
    shiftKey: !!modifiers.shift,
})

test('keys show the Mac way and the Windows way from one definition', () => {
    const show = (shortcut: Shortcut) => [keysFor(shortcut, 'mac'), keysFor(shortcut, 'windows')]

    assert.deepEqual(show(SHORTCUTS['request.saveAs']), [
        ['⇧', '⌘', 'S'],
        ['Ctrl', 'Shift', 'S'],
    ])
    assert.deepEqual(show(SHORTCUTS['request.send']), [
        ['⌘', '↵'],
        ['Ctrl', 'Enter'],
    ])
    assert.deepEqual(show(SHORTCUTS['editor.copyLine']), [
        ['⌥', '⇧', '↑ ↓'],
        ['Alt', 'Shift', '↑ ↓'],
    ])
    assert.deepEqual(show(SHORTCUTS['interface.toggleRightPanel']), [
        ['⌥', '⌘', '\\'],
        ['Ctrl', 'Alt', '\\'],
    ])
    assert.deepEqual(show(SHORTCUTS['editor.redo']), [
        ['⇧', '⌘', 'Z'],
        ['Ctrl', 'Y'],
    ])
    assert.deepEqual(show(SHORTCUTS['editor.fold']), [
        ['⌥', '⌘', '['],
        ['Ctrl', 'Shift', '['],
    ])
    assert.deepEqual(show(SHORTCUTS['editor.leave']), [
        ['Esc', 'Tab'],
        ['Esc', 'Tab'],
    ])
    assert.deepEqual(show(SHORTCUTS['interface.settings']), [
        ['⌘', ','],
        ['Ctrl', ','],
    ])
})

test('no Mac symbol is left in the Windows keys', () => {
    for (const { shortcuts } of shortcutGroups()) {
        for (const shortcut of shortcuts) {
            assert.ok(
                !keysFor(shortcut, 'windows').some((key) => /[⌘⌥⇧↵⌃]/.test(key)),
                shortcut.action,
            )
        }
    }
})

test('every shortcut is in one of the groups, in order', () => {
    const groups = shortcutGroups()

    assert.deepEqual(
        groups.map(({ title }) => title),
        ['Request', 'Sidebar', 'Interface', 'Code editor'],
    )
    assert.equal(groups.flatMap(({ shortcuts }) => shortcuts).length, Object.keys(SHORTCUTS).length)
})

test('key presses match by modifiers and key, with ⌘ or Ctrl', () => {
    assert.ok(matchesShortcut(press('Enter', 'Enter', { meta: true }), 'request.send'))
    assert.ok(matchesShortcut(press('Enter', 'NumpadEnter', { ctrl: true }), 'request.send'))
    assert.ok(!matchesShortcut(press('Enter', 'Enter'), 'request.send'))
    assert.ok(
        !matchesShortcut(
            press('Enter', 'Enter', {
                meta: true,
                shift: true,
            }),
            'request.send',
        ),
    )

    assert.ok(
        matchesShortcut(
            press('S', 'KeyS', {
                meta: true,
                shift: true,
            }),
            'request.saveAs',
        ),
    )
    assert.ok(matchesShortcut(press('k', 'KeyK', { ctrl: true }), 'interface.search'))
    // ⌥ changes the character a key types; the physical key still counts.
    assert.ok(
        matchesShortcut(
            press('«', 'Backslash', {
                meta: true,
                alt: true,
            }),
            'interface.toggleRightPanel',
        ),
    )
    assert.ok(
        !matchesShortcut(
            press('\\', 'Backslash', {
                meta: true,
                alt: true,
            }),
            'interface.toggleSidebar',
        ),
    )
    assert.ok(matchesShortcut(press(',', 'Comma', { meta: true }), 'interface.settings'))
})
