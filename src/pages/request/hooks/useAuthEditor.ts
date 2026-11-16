import { authTypeOf, authValues, emptyAuth, withAuthValues } from '@/pages/request/logic/authTypes'
import { AUTH_ICON_SIZE } from '@/pages/request/logic/config'
import { visibleFields } from '@/pages/request/logic/helpers'
import { toAuthTypeOptions } from '@/pages/request/logic/mappers'
import type { AuthEditorProps, OAuth2Auth } from '@/pages/request/types'
import type { AuthValue } from '#shared/types.ts'

export function useAuthEditor({ auth, onChange, disabled, variables }: AuthEditorProps) {
    const spec = authTypeOf(auth.type)
    const values = authValues(auth)
    const merged = {
        ...spec.defaults,
        ...values,
    }

    const shown = visibleFields(spec.fields, values, spec.defaults)
    const sideSelects = shown.filter((field) => field.side && field.kind === 'select')
    const sideChecks = shown.filter((field) => field.side && field.kind === 'check')
    const mainFields = spec.fields.filter((field) => !field.side && !field.advanced)
    const advancedFields = spec.fields.filter((field) => field.advanced)
    const sideNote = spec.sideNote?.(merged)

    const oauth2: OAuth2Auth | null = auth.type === 'oauth2' && 'values' in auth ? auth : null

    function changeField(key: string, value: AuthValue) {
        onChange(
            withAuthValues(auth, {
                ...values,
                [key]: value,
            }),
        )
    }

    function changeType(type: typeof auth.type) {
        onChange(emptyAuth(type))
    }

    const fieldProps = {
        values,
        defaults: spec.defaults,
        disabled,
        variables,
        onChange: changeField,
    }

    return {
        spec,
        fieldProps,
        typeOptions: toAuthTypeOptions(AUTH_ICON_SIZE),
        sideSelects,
        sideChecks,
        mainFields,
        advancedFields,
        hasAdvanced: advancedFields.length > 0,
        sideNote,
        oauth2,
        isNone: auth.type === 'none',
        showWarning: auth.type !== 'none',
        changeType,
    }
}
