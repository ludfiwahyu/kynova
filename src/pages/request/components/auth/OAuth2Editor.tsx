import { Trash2 } from 'lucide-react'

import { Button, Select, Switch, VariableInput } from '@/components'
import { Advanced } from '@/pages/request/components/auth/Advanced'
import { FieldList } from '@/pages/request/components/auth/FieldList'
import { InfoMark } from '@/pages/request/components/auth/InfoMark'
import { ParamTable } from '@/pages/request/components/auth/ParamTable'
import { useOAuth2Editor } from '@/pages/request/hooks/useOAuth2Editor'
import {
    AUTH_ICON_SIZE,
    HEADER_PREFIX_FIELDS,
    NEW_TOKEN_FIELDS,
    REFRESH_URL_FIELDS,
} from '@/pages/request/logic/config'
import type { OAuth2EditorProps } from '@/pages/request/types'

export function OAuth2Editor(props: OAuth2EditorProps) {
    const { disabled, variables } = props
    const editor = useOAuth2Editor(props)

    return (
        <div className="contents">
            <h3 className="auth-heading">Current Token</h3>

            <div className="auth-rows">
                <div className="auth-row">
                    <span className="auth-label">Token</span>

                    <div className="auth-control auth-token">
                        <div className="auth-token-pick">
                            <Select
                                label="Available tokens"
                                value={editor.chosen?.id ?? ''}
                                options={editor.tokenOptions}
                                onChange={editor.chooseOption}
                            />

                            {editor.chosen && (
                                <Button
                                    variant="icon"
                                    icon={<Trash2 size={AUTH_ICON_SIZE} />}
                                    aria-label={`Delete token ${editor.chosen.name}`}
                                    title="Delete this token"
                                    onClick={editor.removeChosen}
                                />
                            )}
                        </div>

                        <VariableInput
                            className="auth-input"
                            aria-label="Token"
                            placeholder="Token"
                            value={editor.tokenText}
                            variables={variables}
                            disabled={disabled}
                            readOnly={Boolean(editor.chosen)}
                            title={editor.tokenTitle}
                            onChange={editor.typeToken}
                        />
                    </div>
                </div>

                <FieldList
                    fields={HEADER_PREFIX_FIELDS}
                    {...editor.fieldProps}
                />

                <div className="auth-switch-row">
                    <div>
                        <span className="auth-switch-title">Auto-refresh Token</span>
                        <p className="auth-note">
                            An expired token is refreshed before the request is sent, when the
                            server gave a refresh token.
                        </p>
                    </div>

                    <Switch
                        label="Auto-refresh Token"
                        checked={editor.autoRefresh}
                        disabled={disabled}
                        onChange={editor.setAutoRefresh}
                    />
                </div>

                <div className="auth-switch-row">
                    <div>
                        <span className="auth-switch-title">Share Token</span>
                        <p className="auth-note">
                            Saves the token with the request, so anyone with access to it can see
                            and use it.
                        </p>
                    </div>

                    <Switch
                        label="Share Token"
                        checked={editor.isShared}
                        disabled={!editor.canShare}
                        onChange={editor.share}
                    />
                </div>
            </div>

            <h3 className="auth-heading">Configure New Token</h3>

            <div className="auth-rows">
                <FieldList
                    fields={NEW_TOKEN_FIELDS}
                    {...editor.fieldProps}
                />

                {editor.showBrowserNote && (
                    <p className="auth-note">
                        Register <code>{editor.callbackUrl}</code> as the callback URL with the
                        authorization server.
                    </p>
                )}
            </div>

            <Advanced title="Advanced">
                <FieldList
                    fields={REFRESH_URL_FIELDS}
                    {...editor.fieldProps}
                />

                {editor.paramBlocks.map((block) => (
                    <div
                        key={block.key}
                        className="auth-param-block"
                    >
                        <span className="auth-label">
                            {block.label}
                            <InfoMark text={block.info} />
                        </span>

                        <ParamTable
                            label={block.label}
                            rows={block.rows}
                            sendIn={block.sendIn}
                            disabled={disabled}
                            onChange={(rows) => editor.setParams(block.key, rows)}
                        />
                    </div>
                ))}
            </Advanced>

            <div className="auth-actions">
                <Button
                    variant="primary"
                    disabled={editor.isBusy}
                    onClick={editor.getNewToken}
                >
                    Get New Access Token
                </Button>

                {editor.status && (
                    <p
                        className={editor.statusClass}
                        role={editor.statusRole}
                    >
                        {editor.status.message}
                    </p>
                )}
            </div>
        </div>
    )
}
