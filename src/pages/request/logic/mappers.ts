import { createElement } from 'react'

import type { SelectOption } from '@/components'
import { AUTH_TYPES } from '@/pages/request/logic/authTypes'
import { SNIPPET_LANGUAGES, type SnippetLanguage } from '@/pages/request/logic/codegen'
import { PHASES, requestPage, VIEW_TABS } from '@/pages/request/logic/config'
import { activeCount, expiryText } from '@/pages/request/logic/helpers'
import type {
    LiveRequestTab,
    MethodOption,
    Phase,
    PhaseTab,
    ResponseMeta,
    Section,
    TokenView,
} from '@/pages/request/types'
import type { OAuthToken } from '@/stores'
import {
    ancestorNames,
    formatBytes,
    formatDuration,
    type ItemsById,
    statusTone,
    tokenKind,
} from '@/utils'
import type { Item } from '#shared/types.ts'
import type { HttpItem, HttpMethod, Scripts, SendResponse } from '#shared/types.ts'

export function toDestinations(items: ItemsById): SelectOption<string>[] {
    return Object.values(items)
        .filter((candidate: Item) => candidate.kind === 'collection' || candidate.kind === 'folder')
        .map((container) => ({
            value: container.id,
            label: [...ancestorNames(items, container), container.name].join(' / '),
        }))
        .sort((a, b) => a.label.localeCompare(b.label))
}

export function toLanguageOptions(): SelectOption<SnippetLanguage>[] {
    return SNIPPET_LANGUAGES.map(({ id, label }) => ({
        value: id,
        label,
    }))
}

export function toPhaseTabs(scripts: Scripts | undefined): PhaseTab[] {
    return PHASES.map(({ id, label }) => ({
        id: id as Phase,
        label,
        hasScript: Boolean(scripts?.[id]),
    }))
}

export function toMethodOptions(methods: readonly HttpMethod[], value: HttpMethod): MethodOption[] {
    return methods.map((method) => ({
        method,
        isSelected: method === value,
        textClass: `method-text grow method-${method}`,
    }))
}

export function toTokenViews(tokens: Parameters<typeof tokenKind>[0][]): TokenView[] {
    return tokens.map((token, index) => ({
        id: index,
        kind: tokenKind(token),
        text: token.text,
    }))
}

export function toResponseMeta(response: SendResponse): ResponseMeta {
    return {
        tone: statusTone(response.status),
        status: `${response.status} ${response.statusText}`,
        time: formatDuration(response.timeMs),
        size: formatBytes(response.sizeBytes),
    }
}

export function toViewTabs(headerCount: number) {
    return VIEW_TABS.map((tab) => ({
        ...tab,
        ...(tab.id === 'headers' ? { count: headerCount } : {}),
    }))
}

function liveRequestTab(item: HttpItem, id: Section): LiveRequestTab {
    const { request } = item

    switch (id) {
        case 'params':
            return { count: activeCount(request.params) }
        case 'auth':
            return { dot: request.auth.type !== 'none' }
        case 'headers':
            return { count: activeCount(request.headers) }
        case 'body':
            return { dot: request.body.type !== 'none' }
        case 'scripts':
            return { dot: Boolean(item.scripts?.preRequest || item.scripts?.test) }
    }
}

export function toRequestTabs(item: HttpItem) {
    return requestPage.tabs.map((tab) => ({
        ...tab,
        ...liveRequestTab(item, tab.id),
    }))
}

export function toAuthTypeOptions(iconSize: number) {
    return AUTH_TYPES.map(({ type, label, icon: Icon, startsGroup }) => ({
        value: type,
        label,
        icon: createElement(Icon, { size: iconSize }),
        startsGroup,
    }))
}

export function toTokenOptions(tokens: OAuthToken[]): SelectOption<string>[] {
    return [
        {
            value: '',
            label: tokens.length ? 'Available Tokens' : 'No tokens yet',
        },
        ...tokens.map((token) => ({
            value: token.id,
            label: `${token.name}${expiryText(token.expiresAt)}`,
        })),
    ]
}
