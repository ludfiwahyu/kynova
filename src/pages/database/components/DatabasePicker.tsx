import { Check } from 'lucide-react'

import { Button } from '@/components'
import { ExternalDatabaseForm } from '@/pages/database/components/ExternalDatabaseForm'
import { useDatabasePicker } from '@/pages/database/hooks/useDatabasePicker'
import { NOTE_ICON_SIZE } from '@/pages/database/logic/config'
import type { DatabasePickerProps } from '@/pages/database/types'

export function DatabasePicker(props: DatabasePickerProps) {
    const picker = useDatabasePicker(props)

    return (
        <div className="db-picker">
            <div
                className="db-choices"
                role="radiogroup"
                aria-label="Database"
            >
                {picker.choices.map((choice) => (
                    <Button
                        key={choice.id}
                        variant="dbChoice"
                        role="radio"
                        aria-checked={picker.choice === choice.id}
                        onClick={() => picker.setChoice(choice.id)}
                    >
                        {choice.icon}

                        <span>
                            <strong>{choice.title}</strong>
                            <span>{choice.text}</span>
                        </span>
                    </Button>
                ))}
            </div>

            {picker.choice === 'local' && picker.isLocalInUse && (
                <p className="db-note">
                    <Check size={NOTE_ICON_SIZE} /> In use: {picker.current?.detail}.
                </p>
            )}

            {picker.choice === 'local' && !picker.isLocalInUse && (
                <Button
                    disabled={!picker.isIdle}
                    onClick={picker.useLocal}
                >
                    Use the local database
                </Button>
            )}

            {picker.choice === 'external' && <ExternalDatabaseForm picker={picker} />}
        </div>
    )
}
