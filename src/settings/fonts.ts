// ===================================================================
//
//   Interface fonts
//
// ===================================================================

export const UI_FONTS = {
    system: {
        label: 'System',
        hint: 'San Francisco on a Mac, Segoe UI on Windows',
        stack: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    },

    inter: {
        label: 'Inter',
        hint: 'The font Kynova used before',
        stack: "'Inter Variable', system-ui, sans-serif",
    },
}

// ===================================================================
//
//   Code fonts
//
// ===================================================================

export const CODE_FONTS = {
    system: {
        label: 'System mono',
        hint: 'Menlo on a Mac, Consolas on Windows',
        stack: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },

    jetbrains: {
        label: 'JetBrains Mono',
        hint: 'The font Kynova used before',
        stack: "'JetBrains Mono Variable', ui-monospace, Menlo, Consolas, monospace",
    },
}

// ===================================================================
//
//   Types and helpers
//
// ===================================================================

export type UiFont = keyof typeof UI_FONTS

export type CodeFont = keyof typeof CODE_FONTS

/** The fonts as choices for a Select. */
export const fontChoices = (fonts: typeof UI_FONTS | typeof CODE_FONTS) =>
    Object.entries(fonts).map(([value, font]) => ({
        value,
        label: font.label,
        hint: font.hint,
    }))
