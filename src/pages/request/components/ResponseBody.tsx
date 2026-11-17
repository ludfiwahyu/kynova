import { Button, CodeEditor, CopyButton, EmptyState } from '@/components'
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
                        {body.canFormat && (
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

                    <div className="response-editor">
                        <CodeEditor
                            label="Response body"
                            value={body.text}
                            language={body.language}
                            readOnly
                            fill
                            onChange={body.ignoreEdit}
                        />
                    </div>
                </>
            )}
        </div>
    )
}
