import { nextAutoClosing } from '@/pages/request/logic/helpers'
import { setPreferences, usePreferences } from '@/settings'
import { openSettings } from '@/stores'
import type { JsonStyle } from '@/utils'

export function useJsonStyleMenu() {
    const preferences = usePreferences()

    const bracketsOn = preferences.autoClosingBrackets !== 'never'
    const quotesOn = preferences.autoClosingQuotes !== 'never'

    function chooseStyle(jsonStyle: JsonStyle) {
        setPreferences({ jsonStyle })
    }

    function toggleBrackets() {
        setPreferences({ autoClosingBrackets: nextAutoClosing(preferences.autoClosingBrackets) })
    }

    function toggleQuotes() {
        setPreferences({ autoClosingQuotes: nextAutoClosing(preferences.autoClosingQuotes) })
    }

    function toggleFormatOnBlur() {
        setPreferences({ formatOnBlur: !preferences.formatOnBlur })
    }

    function toggleTrailingComma() {
        setPreferences({ trailingComma: !preferences.trailingComma })
    }

    function openMoreSettings() {
        openSettings('editor')
    }

    return {
        jsonStyle: preferences.jsonStyle,
        bracketsOn,
        quotesOn,
        formatOnBlur: preferences.formatOnBlur,
        trailingComma: preferences.trailingComma,
        chooseStyle,
        toggleBrackets,
        toggleQuotes,
        toggleFormatOnBlur,
        toggleTrailingComma,
        openMoreSettings,
    }
}
