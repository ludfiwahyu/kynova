import { ChevronRight, Share2 } from 'lucide-react'

import { Button, CopyButton } from '@/components'
import { PresenceStack } from '@/pages/collaboration'
import { KindPicker } from '@/pages/request/components/KindPicker'
import { NameField } from '@/pages/request/components/NameField'
import { SaveControls } from '@/pages/request/components/SaveControls'
import { useItemHeader } from '@/pages/request/hooks/useItemHeader'
import { HEADER_ICON_SIZE, SEPARATOR_ICON_SIZE } from '@/pages/request/logic/config'
import type { ItemHeaderProps } from '@/pages/request/types'

export function ItemHeader(props: ItemHeaderProps) {
    const { item } = props
    const header = useItemHeader(props)

    return (
        <header className="item-header">
            {header.requestItem && <KindPicker item={header.requestItem} />}

            <nav
                className="breadcrumb"
                aria-label="Location"
            >
                {header.ancestors.map((ancestor) => (
                    <span
                        key={ancestor.id}
                        className="breadcrumb-step"
                    >
                        <Button
                            variant="plain"
                            className="breadcrumb-link"
                            onClick={() => header.openAncestor(ancestor.id)}
                        >
                            {ancestor.name}
                        </Button>

                        <ChevronRight
                            size={SEPARATOR_ICON_SIZE}
                            className="breadcrumb-separator"
                        />
                    </span>
                ))}

                <NameField
                    key={item.name}
                    item={item}
                />
            </nav>

            <span className="grow" />

            <PresenceStack itemId={item.id} />

            {header.requestItem && <SaveControls item={header.requestItem} />}

            <CopyButton
                text={header.shareUrl}
                label="Share"
                copiedLabel="Link copied"
                icon={<Share2 size={HEADER_ICON_SIZE} />}
                variant="default"
                className="header-button"
                title="Copy a link to this for workspace members"
            />
        </header>
    )
}
