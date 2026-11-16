import { Moon, Sun } from 'lucide-react'
import { createElement } from 'react'

import { PANELS, ROLE_LABEL, THEME_CHOICES, THEME_ICON_SIZE } from '@/pages/workspace/logic/config'
import { plural } from '@/pages/workspace/logic/helpers'
import type { MemberLine, PanelView, ThemeOption } from '@/pages/workspace/types'
import type { Item, Member, WorkspaceSettings } from '#shared/types.ts'

export function toCountsLabel(items: Item[], environmentCount: number): string {
    const collections = items.filter((item) => item.kind === 'collection').length
    const requests = items.filter(
        (item) => item.kind === 'http' || item.kind === 'websocket',
    ).length

    return [
        plural(collections, 'collection'),
        plural(requests, 'request'),
        plural(environmentCount, 'environment'),
    ].join(' · ')
}

export function toMemberLines(members: Member[]): MemberLine[] {
    return members.map((member) => ({
        id: member.userId,
        name: member.name,
        color: member.color,
        roleLabel: ROLE_LABEL[member.role],
    }))
}

export function toPanelViews(saved: WorkspaceSettings, isOwner: boolean): PanelView[] {
    return PANELS.map(({ id, label }) => {
        const isLocked = id === 'collections'

        return {
            id,
            label,
            isLocked,
            isOn: isLocked || saved.panels?.[id] !== false,
            switchLabel: `Show ${label}`,
            disabled: !isOwner || isLocked,
        }
    })
}

export function toThemeOptions(): ThemeOption[] {
    return THEME_CHOICES.map((choice) => {
        if (choice.value === 'light') {
            return {
                ...choice,
                icon: createElement(Sun, { size: THEME_ICON_SIZE }),
            }
        }

        if (choice.value === 'dark') {
            return {
                ...choice,
                icon: createElement(Moon, { size: THEME_ICON_SIZE }),
            }
        }

        return { ...choice }
    })
}
