import type { ReactNode } from 'react'

import type { useAuthFieldRow } from '@/pages/request/hooks/useAuthFieldRow'
import type { AuthField } from '@/pages/request/logic/authTypes'
import type { SendProgress } from '@/services'
import type { ResponseState } from '@/stores'
import type { TabId, Variables } from '@/utils'
import type { RequestVersion, SendResponse } from '#shared/types.ts'
import type {
    Auth,
    AuthParam,
    AuthValue,
    AuthValues,
    Body,
    HttpItem,
    HttpMethod,
    Item,
    Scripts,
    WebSocketItem,
} from '#shared/types.ts'

import type { requestPage } from './logic/config'

export type Section = TabId<typeof requestPage>
export interface BodyEditorProps {
    body: Body
    onChange: (body: Body) => void
    disabled: boolean
    variables: Variables
}

export type RequestItem = HttpItem | WebSocketItem
export interface MethodSelectProps {
    value: HttpMethod
    onChange: (method: HttpMethod) => void
    disabled: boolean
}

export type View = 'body' | 'headers'
export interface SaveAsDialogProps {
    item: HttpItem | WebSocketItem
    onClose: () => void
}

export interface ScriptsEditorProps {
    scripts: Scripts | undefined
    onChange: (scripts: Scripts) => void
    disabled: boolean
    fill?: boolean
}

export type Phase = keyof Scripts

export interface CodeSnippetProps {
    item: HttpItem
}

export interface PhaseTab {
    id: Phase
    label: string
    hasScript: boolean
}
export interface UrlBarProps {
    item: HttpItem
    variables: Variables
    canEdit: boolean
    isSending: boolean
    onSend: () => void
}

export interface AuthEditorProps {
    itemId: string
    auth: Auth
    onChange: (auth: Auth) => void
    disabled: boolean
    variables: Variables
}

export interface AuthFieldProps {
    values: AuthValues
    defaults: AuthValues
    onChange: (key: string, value: AuthValue) => void
    disabled: boolean
    variables: Variables
}

export interface OAuth2EditorProps {
    itemId: string
    auth: OAuth2Auth
    onChange: (auth: Auth) => void
    disabled: boolean
    variables: Variables
}

export type OAuth2Auth = Extract<Auth, { values: AuthValues }>

export interface JsonStyleMenuProps {
    editorSettings?: boolean
}

export interface MethodOption {
    method: HttpMethod
    isSelected: boolean
    textClass: string
}

export interface StyledJsonOptions {
    text: string
    onChange: (text: string) => void
}

export interface ResponseViewerProps {
    state: ResponseState | undefined
    grip?: ReactNode
}

export interface ResponseBodyProps {
    response: SendResponse
}

export interface ResponseHeadersProps {
    headers: SendResponse['headers']
}

export interface SendingProgressProps {
    startedAt: number
    progress?: SendProgress
}

export interface ResponseMeta {
    tone: string
    status: string
    time: string
    size: string
}

export interface ItemHeaderProps {
    item: Item
}

export interface NameFieldProps {
    item: Item
}

export interface HistoryMenuProps {
    item: RequestItem
}

export interface VersionListProps {
    item: RequestItem
    onOpen: (version: RequestVersion) => void
}

export interface VersionDialogProps {
    item: RequestItem
    version: RequestVersion
    onClose: () => void
}

export interface NewerSaveBannerProps {
    item: RequestItem
}

export interface KindPickerProps {
    item: RequestItem
}

export interface SaveControlsProps {
    item: RequestItem
}

export interface RequestViewProps {
    item: HttpItem | WebSocketItem
}

export interface HttpEditorProps {
    item: HttpItem
}

export interface MissingVariablesProps {
    item: HttpItem
}

export interface ParamsSectionProps {
    item: HttpItem
    canEdit: boolean
}

export interface LiveRequestTab {
    count?: number
    dot?: boolean
}

// ===================================================================
//
//   Auth
//
// ===================================================================

export interface AuthFieldRowProps extends AuthFieldProps {
    field: AuthField
    bare?: boolean
}

export interface FieldListProps extends AuthFieldProps {
    fields: AuthField[]
}

export interface AdvancedProps {
    title?: string
    note?: string
    children: ReactNode
}

export interface InfoMarkProps {
    text: string
}

export type AuthRowState = ReturnType<typeof useAuthFieldRow>

export interface AuthControlProps {
    row: AuthRowState
    field: AuthField
    disabled: boolean
    variables: Variables
}

export interface ParamTableProps {
    rows: AuthParam[]
    onChange: (rows: AuthParam[]) => void
    sendIn: boolean
    disabled: boolean
    label: string
}

export interface OAuthStatus {
    kind: 'busy' | 'done' | 'error'
    message: string
}

export interface ParamBlock {
    key: 'authRequestParams' | 'tokenRequestParams' | 'refreshRequestParams'
    label: string
    sendIn: boolean
    info: string
}
