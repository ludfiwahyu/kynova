import { Button } from '@/components/ui/Button/Button'
import type { TabsProps } from '@/components/ui/Tabs/types'

export function Tabs<T extends string>({ tabs, active, onChange, label }: TabsProps<T>) {
    return (
        <div
            className="tabs"
            role="tablist"
            aria-label={label}
        >
            {tabs.map((tab) => (
                <Button
                    key={tab.id}
                    variant="plain"
                    role="tab"
                    aria-selected={tab.id === active}
                    onClick={() => onChange(tab.id)}
                >
                    <span
                        className="steady-bold"
                        data-text={tab.label}
                    >
                        {tab.label}
                    </span>

                    {Boolean(tab.count) && <span className="tab-count">{tab.count}</span>}

                    {tab.dot && (
                        <span
                            className="tab-dot"
                            aria-label="has content"
                        />
                    )}
                </Button>
            ))}
        </div>
    )
}
