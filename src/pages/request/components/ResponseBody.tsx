import { Button, CopyButton, EmptyState } from '@/components'
import { JsonStyleMenu } from '@/pages/request/components/JsonStyleMenu'
import { useResponseBody } from '@/pages/request/hooks/useResponseBody'
import type { ResponseBodyProps } from '@/pages/request/types'

export function ResponseBody(props: ResponseBodyProps) {
    const body = useResponseBody(props)

    return (
        <div className="contents">
            {body.isImage && (
                <div className="response-scroll">
                    <img
                        className="response-image"
                        src={body.imageSrc}
                        alt="Response"
                    />
                </div>
            )}

            {body.isOtherBinary && (
                <EmptyState title="Binary response">{body.binaryText}</EmptyState>
            )}

            {body.isBlank && <EmptyState>The response has no body.</EmptyState>}

            {body.hasContent && (
                <>
                    <div className="response-tools">
                        {body.isJson && (
                            <Button
                                variant="ghost"
                                onClick={body.togglePretty}
                            >
                                {body.toggleLabel}
                            </Button>
                        )}

                        <CopyButton text={body.text} />

                        {body.isJson && <JsonStyleMenu />}
                    </div>

                    <pre className="response-scroll code">
                        {body.tokenViews
                            ? body.tokenViews.map((token) => (
                                  <span
                                      key={token.id}
                                      data-token={token.kind}
                                  >
                                      {token.text}
                                  </span>
                              ))
                            : body.text}
                    </pre>
                </>
            )}
        </div>
    )
}
