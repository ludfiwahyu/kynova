import { Select, ThemePreview } from '@/components'
import type { ThemeCardProps } from '@/pages/settings/types'

export function ThemeCard({ card, onChange }: ThemeCardProps) {
    return (
        <div className="theme-card">
            <div className="theme-card-heading">
                <span className="theme-card-icon">{card.icon}</span>

                <div>
                    <div className="setting-label">
                        {card.title} {card.isActive && <span className="badge">Active</span>}
                    </div>

                    <div className="setting-description">{card.description}</div>
                </div>
            </div>

            <ThemePreview theme={card.theme} />

            <Select
                label={card.title}
                value={card.theme}
                options={card.options}
                onChange={(theme) => onChange(card.field, theme)}
            />
        </div>
    )
}
