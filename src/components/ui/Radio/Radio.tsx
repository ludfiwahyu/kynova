import type { RadioProps } from '@/components/ui/Radio/types'

export function Radio({ label, ...rest }: RadioProps) {
    return (
        <label className="radio">
            <input
                type="radio"
                {...rest}
            />
            {label}
        </label>
    )
}
