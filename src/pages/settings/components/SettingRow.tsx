import type { SettingRowProps } from '@/pages/settings/types'

export function SettingRow({ label, description, children }: SettingRowProps) {
    return (
        <div className="setting-row">
            <div className="setting-text">
                <div className="setting-label">{label}</div>
                {description && <div className="setting-description">{description}</div>}
            </div>

            <div className="setting-control">{children}</div>
        </div>
    )
}
