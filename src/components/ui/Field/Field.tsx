import type { FieldProps } from '@/components/ui/Field/types'

export function Field({ label, children }: FieldProps) {
    return (
        <label className="field">
            <span>{label}</span>
            {children}
        </label>
    )
}
