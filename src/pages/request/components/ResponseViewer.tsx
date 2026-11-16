import { SendHorizontal } from 'lucide-react'
import { Fragment } from 'react'

import { EmptyState, Tabs } from '@/components'
import { ResponseBody } from '@/pages/request/components/ResponseBody'
import { ResponseHeaders } from '@/pages/request/components/ResponseHeaders'
import { SendingProgress } from '@/pages/request/components/SendingProgress'
import { useResponseViewer } from '@/pages/request/hooks/useResponseViewer'
import { EMPTY_ICON_SIZE, EMPTY_ICON_STROKE } from '@/pages/request/logic/config'
import type { ResponseViewerProps } from '@/pages/request/types'

export function ResponseViewer(props: ResponseViewerProps) {
    const { state, grip } = props
    const viewer = useResponseViewer(props)

    return (
        <section
            ref={viewer.paneRef}
            className="response-pane"
            data-layout-flip
            aria-label="Response"
        >
            <div className="response-header">
                {viewer.isDone ? (
                    <>
                        <Tabs
                            label="Response"
                            tabs={viewer.tabs}
                            active={viewer.view}
                            onChange={viewer.setView}
                        />

                        <dl className="response-meta">
                            <div data-tone={viewer.meta?.tone}>
                                <dt>Status</dt>
                                <dd>{viewer.meta?.status}</dd>
                            </div>

                            <div>
                                <dt>Time</dt>
                                <dd>{viewer.meta?.time}</dd>
                            </div>

                            <div>
                                <dt>Size</dt>
                                <dd>{viewer.meta?.size}</dd>
                            </div>
                        </dl>
                    </>
                ) : (
                    <h2 className="response-title grow">Response</h2>
                )}

                {grip}
            </div>

            {viewer.isIdle && (
                <EmptyState
                    icon={
                        <SendHorizontal
                            size={EMPTY_ICON_SIZE}
                            strokeWidth={EMPTY_ICON_STROKE}
                        />
                    }
                    className="response-empty"
                >
                    Enter the URL and click Send to get a response.{' '}
                    {viewer.sendKeys.map((key) => (
                        <Fragment key={key}>
                            <kbd>{key}</kbd>{' '}
                        </Fragment>
                    ))}
                    sends too.
                </EmptyState>
            )}

            {state?.status === 'sending' && (
                <>
                    <SendingProgress
                        startedAt={state.startedAt}
                        progress={state.progress}
                    />

                    <div
                        className="response-skeleton"
                        aria-hidden="true"
                    >
                        <span />
                        <span />
                        <span />
                    </div>
                </>
            )}

            {state?.status === 'failed' && (
                <EmptyState
                    title="Could not send request"
                    className="response-empty"
                    action={<p role="alert">{state.message}</p>}
                />
            )}

            {viewer.warning && <p className="response-warning">{viewer.warning}</p>}

            {viewer.response && viewer.view === 'body' && (
                <ResponseBody response={viewer.response} />
            )}

            {viewer.response && viewer.view === 'headers' && (
                <ResponseHeaders headers={viewer.response.headers} />
            )}
        </section>
    )
}
