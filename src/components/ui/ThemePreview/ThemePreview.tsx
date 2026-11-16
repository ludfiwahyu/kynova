import { accentStyle } from '@/components/ui/ThemePreview/logic/accentStyle'
import type { ThemePreviewProps } from '@/components/ui/ThemePreview/types'
import { themeScheme } from '@/settings'

export function ThemePreview({ theme, accent }: ThemePreviewProps) {
    const style = accentStyle(accent)

    return (
        <div
            className="theme-preview"
            data-theme={theme}
            data-scheme={themeScheme(theme)}
            style={style}
            aria-hidden="true"
        >
            <div className="preview-top">
                <span />
                <span />
                <span className="preview-search" />
            </div>
            <div className="preview-body">
                <div className="preview-side">
                    <span />
                    <span />
                    <span />
                </div>
                <div className="preview-main">
                    <div className="preview-url">
                        <span className="preview-field" />
                        <span className="preview-send" />
                    </div>
                    <div className="preview-tabs">
                        <span className="preview-tab-active" />
                        <span />
                        <span />
                    </div>
                </div>
            </div>
        </div>
    )
}
