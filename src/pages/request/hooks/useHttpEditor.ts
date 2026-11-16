import type { CSSProperties, KeyboardEvent } from 'react'
import { useRef, useState } from 'react'

import { useEnterAnimation, useVariables } from '@/hooks'
import {
    clampShare,
    REQUEST_SHARE,
    SIDE_SHARE,
    SPLIT_FIRST_VAR,
    SPLIT_SECOND_VAR,
} from '@/pages/request/logic/config'
import { toRequestTabs } from '@/pages/request/logic/mappers'
import type { HttpEditorProps, Section } from '@/pages/request/types'
import { matchesShortcut } from '@/settings'
import type { Dock } from '@/stores'
import {
    DEFAULT_LAYOUT,
    editDraft,
    keepTab,
    sendItem,
    setLayout,
    updateRequest,
    useCanEdit,
    useResponses,
    useUi,
    useWorkspaceId,
} from '@/stores'
import type { Auth, Body, KeyValue, Scripts } from '#shared/types.ts'

export function useHttpEditor({ item }: HttpEditorProps) {
    const { request } = item
    const workspaceId = useWorkspaceId()
    const canEdit = useCanEdit()
    const variables = useVariables(item)
    const response = useResponses((responses) => responses[item.id])
    const requestShare = useUi((state) => state.layout.requestShare)
    const requestWidthShare = useUi((state) => state.layout.requestWidthShare)
    const dock = useUi((state) => state.layout.responseDock)

    const [section, setSection] = useState<Section>('params')
    const sectionRef = useRef<HTMLDivElement>(null)
    const splitRef = useRef<HTMLDivElement>(null)
    const dragStart = useRef(0)

    useEnterAnimation(sectionRef, section)

    const isSending = response?.status === 'sending'
    const isSide = dock !== 'bottom'

    // The share of the first track: the request, or the response when it sits on the left.
    let firstShare = requestShare

    if (dock === 'left') {
        firstShare = 1 - requestWidthShare
    } else if (isSide) {
        firstShare = requestWidthShare
    }

    // The tracks read these in request-split's CSS, which also stacks the panes when the editor is narrow.
    const splitStyle = {
        [SPLIT_FIRST_VAR]: `${firstShare}fr`,
        [SPLIT_SECOND_VAR]: `${1 - firstShare}fr`,
    } as CSSProperties

    const tabs = toRequestTabs(item)

    // Sending

    function send() {
        if (request.url.trim() && !isSending) {
            keepTab({
                kind: 'item',
                id: item.id,
            })
            void sendItem(item, workspaceId, variables)
        }
    }

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        if (matchesShortcut(event, 'request.send')) {
            send()
        }
    }

    // Editing

    function changeAuth(auth: Auth) {
        updateRequest(item, { auth })
    }

    function changeHeaders(headers: KeyValue[]) {
        updateRequest(item, { headers })
    }

    function changeBody(body: Body) {
        updateRequest(item, { body })
    }

    function changeScripts(scripts: Scripts) {
        editDraft(item.id, { scripts })
    }

    // Dividers

    function splitSize(side: boolean) {
        const area = splitRef.current

        return (side ? area?.clientWidth : area?.clientHeight) ?? 1
    }

    function startSideDrag() {
        dragStart.current = firstShare * splitSize(true)
    }

    function dragSide(delta: number) {
        const first = clampShare((dragStart.current + delta) / splitSize(true), SIDE_SHARE)

        setLayout({ requestWidthShare: dock === 'left' ? 1 - first : first })
    }

    function resetSide() {
        setLayout({ requestWidthShare: DEFAULT_LAYOUT.requestWidthShare })
    }

    function startBottomDrag() {
        dragStart.current = requestShare * splitSize(false)
    }

    function dragBottom(delta: number) {
        setLayout({
            requestShare: clampShare((dragStart.current + delta) / splitSize(false), REQUEST_SHARE),
        })
    }

    function resetBottom() {
        setLayout({ requestShare: DEFAULT_LAYOUT.requestShare })
    }

    function dockResponse(responseDock: Dock) {
        setLayout({ responseDock })
    }

    function splitArea() {
        return splitRef.current
    }

    return {
        canEdit,
        variables,
        response,
        dock,
        section,
        sectionRef,
        splitRef,
        isSending,
        isSide,
        splitStyle,
        tabs,
        setSection,
        send,
        handleKeyDown,
        changeAuth,
        changeHeaders,
        changeBody,
        changeScripts,
        startSideDrag,
        dragSide,
        resetSide,
        startBottomDrag,
        dragBottom,
        resetBottom,
        dockResponse,
        splitArea,
    }
}
