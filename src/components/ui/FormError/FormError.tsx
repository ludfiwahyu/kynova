import type { FormErrorProps } from '@/components/ui/FormError/types'

export function FormError({ children, alert = true }: FormErrorProps) {
    return (
        <p
            className="form-error"
            role={alert ? 'alert' : undefined}
        >
            {children}
        </p>
    )
}
