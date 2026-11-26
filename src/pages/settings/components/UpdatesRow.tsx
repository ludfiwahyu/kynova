import { Button } from '@/components'
import { SettingRow } from '@/pages/settings/components/SettingRow'
import { useUpdatesRow } from '@/pages/settings/hooks/useUpdatesRow'

export function UpdatesRow() {
    const updates = useUpdatesRow()

    if (!updates) {
        return null
    }

    return (
        <SettingRow
            label="Updates"
            description={<span role="status">{updates.description}</span>}
        >
            <Button
                disabled={updates.isBusy}
                onClick={updates.run}
            >
                {updates.button}
            </Button>
        </SettingRow>
    )
}
