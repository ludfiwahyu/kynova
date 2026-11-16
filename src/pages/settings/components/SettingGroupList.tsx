import { Button } from '@/components'
import { SettingControl } from '@/pages/settings/components/SettingControl'
import { SettingRow } from '@/pages/settings/components/SettingRow'
import { useSettingGroupList } from '@/pages/settings/hooks/useSettingGroupList'
import type { SettingGroupListProps } from '@/pages/settings/types'

export function SettingGroupList({ groups }: SettingGroupListProps) {
    const list = useSettingGroupList()

    return (
        <div className="contents">
            {groups.map((group) => (
                <section key={group.title}>
                    {group.reset ? (
                        <div className="settings-group-heading">
                            <h3 className="settings-group-title">{group.title}</h3>

                            <Button onClick={() => list.reset(group)}>Reset</Button>
                        </div>
                    ) : (
                        <h3 className="settings-group-title">{group.title}</h3>
                    )}

                    {group.fields.map((field) => (
                        <SettingRow
                            key={field.key}
                            label={field.label}
                            description={field.description}
                        >
                            <SettingControl field={field} />
                        </SettingRow>
                    ))}
                </section>
            ))}
        </div>
    )
}
