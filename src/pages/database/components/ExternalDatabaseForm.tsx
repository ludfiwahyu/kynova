import { Eye, EyeOff } from 'lucide-react'

import { Button, Input, Select, TextArea } from '@/components'
import { RecentDatabases } from '@/pages/database/components/RecentDatabases'
import { CA_PLACEHOLDER, EYE_ICON_SIZE, URL_PLACEHOLDER } from '@/pages/database/logic/config'
import type { DatabasePickerPartProps } from '@/pages/database/types'

export function ExternalDatabaseForm({ picker }: DatabasePickerPartProps) {
    return (
        <form
            className="db-form"
            onSubmit={picker.useExternal}
        >
            {picker.recentRows.length > 0 && <RecentDatabases picker={picker} />}

            <div className="field">
                <label
                    className="db-field-label"
                    htmlFor={picker.urlId}
                >
                    Connection string
                </label>

                <span className="db-secret">
                    <Input
                        variant="code"
                        id={picker.urlId}
                        aria-describedby={picker.hintId}
                        type={picker.urlType}
                        value={picker.url}
                        autoComplete="off"
                        spellCheck={false}
                        placeholder={URL_PLACEHOLDER}
                        required
                        onValueChange={picker.changeUrl}
                    />

                    <Button
                        variant="icon"
                        icon={
                            picker.showUrl ? (
                                <EyeOff size={EYE_ICON_SIZE} />
                            ) : (
                                <Eye size={EYE_ICON_SIZE} />
                            )
                        }
                        aria-label={picker.eyeLabel}
                        onClick={picker.toggleUrl}
                    />
                </span>

                <span
                    className="db-hint"
                    id={picker.hintId}
                >
                    {picker.urlHint}
                </span>
            </div>

            <div className="field">
                <span>SSL</span>

                <Select
                    label="SSL"
                    value={picker.ssl}
                    options={picker.sslOptions}
                    onChange={picker.chooseSsl}
                />
            </div>

            {picker.ssl === 'verify' && (
                <label className="field">
                    <span>CA certificate (optional)</span>

                    <TextArea
                        variant="code"
                        rows={3}
                        value={picker.ca}
                        spellCheck={false}
                        placeholder={CA_PLACEHOLDER}
                        onValueChange={picker.setCa}
                    />

                    <span className="db-hint">{picker.caHint}</span>
                </label>
            )}

            {picker.result && (
                <p
                    className={picker.resultClass}
                    role={picker.resultRole}
                >
                    {picker.result.message}
                </p>
            )}

            <div className="db-actions">
                <Button
                    disabled={!picker.canSubmit}
                    onClick={picker.testConnection}
                >
                    {picker.testLabel}
                </Button>

                <Button
                    variant="primary"
                    submit
                    disabled={!picker.canSubmit}
                >
                    {picker.useLabel}
                </Button>
            </div>
        </form>
    )
}
