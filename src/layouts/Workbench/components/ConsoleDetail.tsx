import { FormError } from '@/components'
import { HeaderList } from '@/layouts/Workbench/components/HeaderList'
import type { ConsoleDetailProps } from '@/layouts/Workbench/types'

export function ConsoleDetail({ row }: ConsoleDetailProps) {
    return (
        <div className="console-detail">
            <section>
                <h4>Request Headers</h4>
                <HeaderList headers={row.requestHeaders} />
            </section>

            {row.requestBody !== null && (
                <section>
                    <h4>Request Body</h4>
                    <pre className="console-body code">{row.requestBodyText}</pre>
                </section>
            )}

            {row.hasResponse && (
                <>
                    <section>
                        <h4>Response Headers</h4>
                        <HeaderList headers={row.responseHeaders} />
                    </section>

                    <section>
                        <h4>Response Body</h4>
                        <pre className="console-body code">{row.responseBody}</pre>
                    </section>
                </>
            )}

            {row.error && <FormError alert={false}>{row.error}</FormError>}
        </div>
    )
}
