import type { EmptyStateProps } from '@/components/ui/EmptyState/types'
import { classNames } from '@/components/utils/helpers'

export function EmptyState({ icon, title, children, action, className }: EmptyStateProps) {
    return (
        <div className={classNames('empty', className)}>
            {icon}
            {title && <h3>{title}</h3>}
            {children && <p>{children}</p>}
            {action}
        </div>
    )
}
