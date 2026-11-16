import { Folder, LibraryBig, SlidersHorizontal } from 'lucide-react'

import { tagAttributes } from '@/components/ui/ColorTagPicker/logic/helpers'
import { SHORT_METHOD } from '@/components/ui/ItemGlyph/logic/config'
import type { HttpMethod, Item, TagColor } from '#shared/types.ts'

/** The small coloured method label used in the tree, tabs and search: GET, POST, DEL, WS. */
export function MethodLabel({ method }: { method: HttpMethod | 'WS' }) {
    return (
        <span
            className="method"
            data-method={method}
        >
            {method === 'WS' ? 'WS' : (SHORT_METHOD[method] ?? method)}
        </span>
    )
}

/** The colour square that stands in for a collection's or environment's icon. */
function TagDot({ color }: { color: TagColor }) {
    return (
        <span
            className="tag-dot"
            {...tagAttributes(color)}
        />
    )
}

export function ItemGlyph({ item }: { item: Item }) {
    if (item.kind === 'collection' && item.color) {
        return <TagDot color={item.color} />
    }

    if (item.kind === 'collection') {
        return (
            <LibraryBig
                size={14}
                className="item-icon"
            />
        )
    }

    if (item.kind === 'folder') {
        return (
            <Folder
                size={14}
                className="item-icon"
            />
        )
    }

    return <MethodLabel method={item.kind === 'http' ? item.request.method : 'WS'} />
}

export function EnvironmentGlyph({ color }: { color?: TagColor }) {
    if (color) {
        return <TagDot color={color} />
    }

    return (
        <SlidersHorizontal
            size={13}
            className="item-icon"
        />
    )
}
