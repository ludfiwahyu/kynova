import { VariableContext } from '@/components'
import { HttpEditor } from '@/pages/request/components/HttpEditor'
import { ItemHeader } from '@/pages/request/components/ItemHeader'
import { NewerSaveBanner } from '@/pages/request/components/NewerSaveBanner'
import { useRequestView } from '@/pages/request/hooks/useRequestView'
import type { RequestViewProps } from '@/pages/request/types'
import { WebSocketWorkbench } from '@/pages/websocket'

export function RequestView(props: RequestViewProps) {
    const { item } = props
    const view = useRequestView(props)

    return (
        <VariableContext.Provider value={view.variableContext}>
            <div
                className="request-view"
                onInputCapture={view.keepOpen}
            >
                <ItemHeader item={item} />
                <NewerSaveBanner item={item} />

                {view.httpItem && <HttpEditor item={view.httpItem} />}
                {view.socketItem && <WebSocketWorkbench item={view.socketItem} />}
            </div>
        </VariableContext.Provider>
    )
}
