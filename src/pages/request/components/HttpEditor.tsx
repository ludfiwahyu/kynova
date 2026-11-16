import { DockGrip, KeyValueTable, ResizeHandle, Tabs } from '@/components'
import { AuthEditor } from '@/pages/request/components/auth/AuthEditor'
import { BodyEditor } from '@/pages/request/components/BodyEditor'
import { MissingVariables } from '@/pages/request/components/MissingVariables'
import { ParamsSection } from '@/pages/request/components/ParamsSection'
import { ResponseViewer } from '@/pages/request/components/ResponseViewer'
import { ScriptsEditor } from '@/pages/request/components/ScriptsEditor'
import { UrlBar } from '@/pages/request/components/UrlBar'
import { useHttpEditor } from '@/pages/request/hooks/useHttpEditor'
import { RESPONSE_PLACES } from '@/pages/request/logic/config'
import type { HttpEditorProps } from '@/pages/request/types'

export function HttpEditor(props: HttpEditorProps) {
    const { item } = props
    const { request } = item
    const editor = useHttpEditor(props)

    return (
        <div
            className="http-editor"
            onKeyDown={editor.handleKeyDown}
        >
            <UrlBar
                item={item}
                variables={editor.variables}
                canEdit={editor.canEdit}
                isSending={editor.isSending}
                onSend={editor.send}
            />

            <MissingVariables item={item} />

            <div
                ref={editor.splitRef}
                className="request-split"
                data-dock={editor.dock}
                style={editor.splitStyle}
            >
                <section
                    className="request-pane"
                    data-layout-flip
                    aria-label="Request"
                >
                    <Tabs
                        label="Request"
                        tabs={editor.tabs}
                        active={editor.section}
                        onChange={editor.setSection}
                    />

                    <div
                        ref={editor.sectionRef}
                        className="request-section"
                    >
                        {editor.section === 'params' && (
                            <ParamsSection
                                item={item}
                                canEdit={editor.canEdit}
                            />
                        )}

                        {editor.section === 'auth' && (
                            <AuthEditor
                                itemId={item.id}
                                auth={request.auth}
                                disabled={!editor.canEdit}
                                variables={editor.variables}
                                onChange={editor.changeAuth}
                            />
                        )}

                        {editor.section === 'headers' && (
                            <KeyValueTable
                                rows={request.headers}
                                disabled={!editor.canEdit}
                                variables={editor.variables}
                                onChange={editor.changeHeaders}
                            />
                        )}

                        {editor.section === 'body' && (
                            <BodyEditor
                                body={request.body}
                                disabled={!editor.canEdit}
                                variables={editor.variables}
                                onChange={editor.changeBody}
                            />
                        )}

                        {editor.section === 'scripts' && (
                            <ScriptsEditor
                                scripts={item.scripts}
                                disabled={!editor.canEdit}
                                fill
                                onChange={editor.changeScripts}
                            />
                        )}
                    </div>
                </section>

                {editor.isSide ? (
                    <ResizeHandle
                        key="side"
                        orientation="vertical"
                        label="Resize request and response"
                        onDragStart={editor.startSideDrag}
                        onDrag={editor.dragSide}
                        onReset={editor.resetSide}
                    />
                ) : (
                    <ResizeHandle
                        key="bottom"
                        orientation="horizontal"
                        label="Resize request and response"
                        onDragStart={editor.startBottomDrag}
                        onDrag={editor.dragBottom}
                        onReset={editor.resetBottom}
                    />
                )}

                <ResponseViewer
                    state={editor.response}
                    grip={
                        <DockGrip
                            name="Response"
                            dock={editor.dock}
                            onDock={editor.dockResponse}
                            area={editor.splitArea}
                            labels={RESPONSE_PLACES}
                        />
                    }
                />
            </div>
        </div>
    )
}
