export const INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)|(\[[^\]]+\]\([^)\s]+\))/g

export const SAFE_LINK = /^(https?:|mailto:)/i

export const LINK_PARTS = /^\[([^\]]+)\]\(([^)\s]+)\)$/

export const HEADING_OFFSET = 2

export const MAX_HEADING = 6

export const HEADING_LINE = /^(#{1,6})\s+(.*)$/

export const LIST_ITEM = /^\s*(?:([-*])|(\d+)\.)\s+(.*)$/

export const NOT_PARAGRAPH = /^(#|```|\s*([-*]|\d+\.)\s)/
