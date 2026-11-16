import { Button, VariableInput } from '@/components'
import { MethodSelect } from '@/pages/request/components/MethodSelect'
import { useUrlBar } from '@/pages/request/hooks/useUrlBar'
import { URL_PLACEHOLDER } from '@/pages/request/logic/config'
import type { UrlBarProps } from '@/pages/request/types'

export function UrlBar(props: UrlBarProps) {
    const { variables, canEdit, onSend } = props
    const bar = useUrlBar(props)

    return (
        <div className="url-bar">
            <div className="url-box">
                <MethodSelect
                    value={bar.method}
                    disabled={!canEdit}
                    onChange={bar.changeMethod}
                />

                <VariableInput
                    className="url-input"
                    aria-label="Request URL"
                    placeholder={URL_PLACEHOLDER}
                    value={bar.shown}
                    variables={variables}
                    disabled={!canEdit}
                    onBlur={bar.endTyping}
                    onChange={bar.changeUrl}
                    onKeyDown={bar.handleKeyDown}
                />
            </div>

            <Button
                variant="send"
                disabled={bar.sendDisabled}
                onClick={onSend}
            >
                {bar.sendLabel}
            </Button>
        </div>
    )
}
