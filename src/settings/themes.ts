// ===================================================================
//
//   Themes
//
// ===================================================================

/** `scheme` picks the light or dark set of status and method colours. */
export const THEMES = [
    {
        id: 'light',
        label: 'Light',
        scheme: 'light',
    },

    {
        id: 'dark',
        label: 'Dark',
        scheme: 'dark',
    },

    {
        id: 'ayu-light',
        label: 'Ayu Light',
        scheme: 'light',
    },

    {
        id: 'ayu-dark',
        label: 'Ayu Dark',
        scheme: 'dark',
    },

    {
        id: 'dracula',
        label: 'Dracula',
        scheme: 'dark',
    },

    {
        id: 'monokai',
        label: 'Monokai',
        scheme: 'dark',
    },

    {
        id: 'night-owl-light',
        label: 'Night Owl Light',
        scheme: 'light',
    },

    {
        id: 'night-owl-dark',
        label: 'Night Owl Dark',
        scheme: 'dark',
    },

    {
        id: 'solarized-light',
        label: 'Solarized Light',
        scheme: 'light',
    },

    {
        id: 'solarized-dark',
        label: 'Solarized Dark',
        scheme: 'dark',
    },

    {
        id: 'high-contrast-light',
        label: 'High Contrast Light',
        scheme: 'light',
    },

    {
        id: 'high-contrast-dark',
        label: 'High Contrast Dark',
        scheme: 'dark',
    },
] as const

export type ThemeName = (typeof THEMES)[number]['id']

// ===================================================================
//
//   Applying a theme
//
// ===================================================================

export function themeScheme(name: ThemeName): 'light' | 'dark' {
    const theme = THEMES.find((candidate) => candidate.id === name)

    return theme?.scheme ?? 'dark'
}

/** Sets the theme on the document. */
export function applyTheme(name: ThemeName): void {
    const root = document.documentElement

    root.dataset.theme = name
    root.dataset.scheme = themeScheme(name)
}

// ===================================================================
//
//   Workspace accent
//
// ===================================================================

/** White or near-black text, whichever reads better on `hex`. */
export function readableInkOn(hex: string): string {
    const [r, g, b] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)

    const linear = (channel: number) => {
        if (channel <= 0.03928) {
            return channel / 12.92
        }

        return ((channel + 0.055) / 1.055) ** 2.4
    }

    const luminance = 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)

    return luminance > 0.4 ? '#111111' : '#ffffff'
}

/** Overrides the theme's accent with a workspace colour, or restores it with `undefined`. */
export function applyAccent(
    color: string | undefined,
    target: HTMLElement = document.documentElement,
): void {
    if (color) {
        target.style.setProperty('--accent', color)
        target.style.setProperty('--accent-ink', readableInkOn(color))

        return
    }

    target.style.removeProperty('--accent')
    target.style.removeProperty('--accent-ink')
}
