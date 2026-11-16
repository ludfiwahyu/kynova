import type { SyntheticEvent } from 'react'
import { useEffect, useRef } from 'react'

import { useEnterAnimation } from '@/hooks'
import { SECTIONS } from '@/pages/settings/logic/config'
import { closeSettings, type SettingsSection, useUi } from '@/stores'
import { enter } from '@/utils'

export function useSettingsDialog() {
    const section = useUi((state) => state.settingsSection)
    const dialogRef = useRef<HTMLDialogElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEnterAnimation(scrollRef, section)

    useEffect(() => {
        if (section && !dialogRef.current?.open) {
            dialogRef.current?.showModal()

            // Fades in. It closes at once: a fade out would let a quick ⌘, land on a closing dialog.
            if (dialogRef.current) {
                enter(dialogRef.current)
            }
        }
    }, [section])

    const current = SECTIONS.find(({ id }) => id === section)

    // Escape closes through state, at once. Letting the browser close it first delivers a late
    // "close" event that would shut Settings again if it was reopened in between.
    function handleCancel(event: SyntheticEvent) {
        event.preventDefault()
        closeSettings()
    }

    function choose(next: SettingsSection) {
        useUi.setState({ settingsSection: next })
    }

    return {
        section,
        title: current?.label ?? '',
        sections: SECTIONS,
        dialogRef,
        scrollRef,
        handleCancel,
        choose,
        close: closeSettings,
    }
}
