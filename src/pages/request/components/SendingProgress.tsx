import { useSendingProgress } from '@/pages/request/hooks/useSendingProgress'
import type { SendingProgressProps } from '@/pages/request/types'

export function SendingProgress(props: SendingProgressProps) {
    const sending = useSendingProgress(props)

    return (
        <div className="px-4 pt-2">
            <div
                role="progressbar"
                aria-label="Response progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={sending.percent ?? undefined}
                aria-valuetext={sending.label}
                className="relative h-0.5 overflow-hidden rounded-full bg-hover"
            >
                {sending.percent !== null ? (
                    <div
                        className="h-full rounded-full bg-accent transition-[width] duration-200 ease-out"
                        style={sending.barStyle}
                    />
                ) : (
                    <div className="response-progress-sweep h-full w-1/3 rounded-full bg-accent" />
                )}
            </div>

            <p className="mt-1 mb-0 text-right font-mono text-[11px] text-ink-3 tabular-nums">
                {sending.label}
            </p>
        </div>
    )
}
