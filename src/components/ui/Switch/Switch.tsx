import type { SwitchProps } from '@/components/ui/Switch/types'

export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            className="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange(!checked)}
        >
            <span className="switch-thumb" />
        </button>
    )
}
