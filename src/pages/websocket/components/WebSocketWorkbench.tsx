import { Trash2 } from 'lucide-react'

import { Button, EmptyState, Input, TextArea } from '@/components'
import { MessageRow } from '@/pages/websocket/components/MessageRow'
import { useWebSocketWorkbench } from '@/pages/websocket/hooks/useWebSocketWorkbench'
import { CLEAR_ICON_SIZE, URL_PLACEHOLDER } from '@/pages/websocket/logic/config'
import type { WebSocketWorkbenchProps } from '@/pages/websocket/types'

export function WebSocketWorkbench({ item }: WebSocketWorkbenchProps) {
    const socket = useWebSocketWorkbench(item)

    return (
        <div className="http-editor">
            <div className="url-bar">
                <div className="url-box">
                    <span
                        className="method-select socket-tag"
                        data-method="WS"
                    >
                        WS
                    </span>

                    <Input
                        variant="plain"
                        className="url-input-plain"
                        aria-label="WebSocket URL"
                        placeholder={URL_PLACEHOLDER}
                        spellCheck={false}
                        value={item.url}
                        disabled={socket.urlDisabled}
                        onValueChange={socket.changeUrl}
                    />
                </div>

                <Button
                    variant={socket.connectVariant}
                    disabled={socket.connectDisabled}
                    onClick={socket.toggleConnection}
                >
                    {socket.connectLabel}
                </Button>
            </div>

            <div className="socket-composer">
                <TextArea
                    variant="code"
                    aria-label="Message"
                    rows={4}
                    spellCheck={false}
                    placeholder={socket.messagePlaceholder}
                    value={socket.draft}
                    disabled={!socket.isOpen}
                    onValueChange={socket.setDraft}
                    onKeyDown={socket.handleKeyDown}
                />

                <Button
                    variant="primary"
                    disabled={!socket.canSend}
                    onClick={socket.sendDraft}
                >
                    Send
                </Button>
            </div>

            <section
                className="response-pane socket-pane"
                aria-label="Messages"
            >
                <div className="response-header">
                    <h2 className="socket-title">
                        Messages <span className="muted">· {socket.status}</span>
                    </h2>

                    <Button
                        variant="ghost"
                        icon={<Trash2 size={CLEAR_ICON_SIZE} />}
                        disabled={!socket.hasMessages}
                        onClick={socket.clear}
                    >
                        Clear
                    </Button>
                </div>

                {socket.hasMessages ? (
                    <ol className="socket-log response-scroll">
                        {socket.messages.map((message) => (
                            <MessageRow
                                key={message.id}
                                message={message}
                            />
                        ))}
                    </ol>
                ) : (
                    <EmptyState title="No messages yet">
                        Connect, then send a message. Everything sent and received is listed here.
                    </EmptyState>
                )}
            </section>
        </div>
    )
}
