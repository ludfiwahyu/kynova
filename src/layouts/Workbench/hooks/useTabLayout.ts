import { useLayoutEffect } from 'react'

import { TAB_ENTER } from '@/layouts/Workbench/logic/config'
import { tabKey } from '@/layouts/Workbench/logic/helpers'
import type { TabLayout } from '@/layouts/Workbench/types'
import type { Tab } from '@/stores'
import { enter, glide } from '@/utils'

/** Moves the dragged tab's picture to where the pointer holds it, wherever the layout put it. */
export function placeDragged({ stripRef, elements, drag }: TabLayout) {
    const strip = stripRef.current
    const element = drag.current && elements.current.get(drag.current.key)

    if (!strip || !element || !drag.current) {
        return
    }

    const layoutLeft = strip.getBoundingClientRect().left - strip.scrollLeft + element.offsetLeft

    element.style.transform = `translateX(${drag.current.screenLeft - layoutLeft}px)`
}

// After every change of order: new tabs fade in, moved tabs glide to their new place.
export function useTabLayout(layout: TabLayout, tabs: Tab[]) {
    useLayoutEffect(() => {
        const { elements, lastLeft, drag } = layout
        const next = new Map<string, number>()
        const firstTime = lastLeft.current.size === 0

        for (const tab of tabs) {
            const key = tabKey(tab)
            const element = elements.current.get(key)

            if (!element) {
                continue
            }

            const left = element.offsetLeft
            const before = lastLeft.current.get(key)

            next.set(key, left)

            if (drag.current?.key === key) {
                placeDragged(layout)
            } else if (before === undefined) {
                if (!firstTime) {
                    enter(element, TAB_ENTER)
                }
            } else {
                glide(element, before - left)
            }
        }

        lastLeft.current = next
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tabs])
}
