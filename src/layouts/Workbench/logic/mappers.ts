import { CircleAlert, TriangleAlert } from 'lucide-react'
import { createElement } from 'react'

import {
    ISSUE_ICON_SIZE,
    MAX_SEARCH_RESULTS,
    RAIL_ICON_SIZE,
    RAIL_ICON_STROKE,
    RIGHT_PANELS,
    TIME_FORMAT,
} from '@/layouts/Workbench/logic/config'
import { matchesQuery } from '@/layouts/Workbench/logic/helpers'
import type {
    ConsoleRowView,
    IssueCounts,
    IssueRowView,
    RailItem,
    SearchRow,
    WorkspaceLine,
} from '@/layouts/Workbench/types'
import { type ConsoleEntry, isProblem, type RightPanel as PanelId } from '@/stores'
import {
    ancestorNames,
    formatBytes,
    formatDuration,
    type Issue,
    type ItemsById,
    statusTone,
} from '@/utils'
import type { Item, Workspace } from '#shared/types.ts'

export function toSearchResults(items: ItemsById, query: string): Item[] {
    const needle = query.trim().toLowerCase()

    if (!needle) {
        return []
    }

    return Object.values(items)
        .filter((item) => matchesQuery(item, needle))
        .slice(0, MAX_SEARCH_RESULTS)
}

export function toSearchRows(
    results: Item[],
    items: ItemsById,
    listId: string,
    selected: number,
): SearchRow[] {
    return results.map((item, index) => ({
        id: item.id,
        domId: `${listId}-${index}`,
        item,
        path: ancestorNames(items, item).join(' / '),
        isSelected: index === selected,
    }))
}

export function toWorkspaceLines(workspaces: Workspace[], activeId: string): WorkspaceLine[] {
    return workspaces.map((workspace) => {
        const isActive = workspace.id === activeId

        return {
            id: workspace.id,
            name: workspace.name,
            isActive,
            iconStyle: { visibility: isActive ? 'visible' : 'hidden' },
        }
    })
}

export function toRailItems(open: PanelId | null, commentCount: number): RailItem[] {
    return RIGHT_PANELS.map(({ id, label, icon }) => ({
        id,
        label,
        icon: createElement(icon, {
            size: RAIL_ICON_SIZE,
            strokeWidth: RAIL_ICON_STROKE,
        }),
        isPressed: open === id,
        count: id === 'comments' ? commentCount : 0,
    }))
}

export function toConsoleRows(entries: ConsoleEntry[]): ConsoleRowView[] {
    return entries.map((entry) => {
        const { request, response, error } = entry

        let responseBody = ''

        if (response) {
            responseBody = response.bodyIsBase64
                ? `Binary, ${formatBytes(response.sizeBytes)}`
                : response.body || 'The response has no body.'
        }

        return {
            id: entry.id,
            time: TIME_FORMAT.format(entry.at),
            method: request.method,
            url: request.url,
            source: entry.source,
            isProblem: isProblem(entry),
            hasResponse: Boolean(response),
            status: response ? String(response.status) : '',
            tone: response ? statusTone(response.status) : 'bad',
            duration: response ? formatDuration(response.timeMs) : '',
            errorText: error ? 'Error' : '',
            requestHeaders: request.headers,
            requestBody: request.body,
            requestBodyText: request.body || ' ',
            responseHeaders: response?.headers ?? [],
            responseBody,
            error,
        }
    })
}

export function toIssueRows(issues: Issue[]): IssueRowView[] {
    return issues.map((issue, index) => ({
        key: index,
        issue,
        icon: createElement(issue.severity === 'error' ? CircleAlert : TriangleAlert, {
            size: ISSUE_ICON_SIZE,
            className: 'issue-icon',
            'aria-label': issue.severity === 'error' ? 'Error' : 'Warning',
        }),
    }))
}

export function toIssueCounts(issues: Issue[]): IssueCounts {
    const errors = issues.filter((issue) => issue.severity === 'error').length
    const warnings = issues.length - errors

    return {
        errors: `${errors} ${errors === 1 ? 'Error' : 'Errors'}`,
        warnings: `${warnings} ${warnings === 1 ? 'Warning' : 'Warnings'}`,
    }
}
