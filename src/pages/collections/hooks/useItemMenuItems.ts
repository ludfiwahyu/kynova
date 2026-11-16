import { isContainer, isRequest } from '@/pages/collections/logic/config'
import { addChild, confirmDelete } from '@/pages/collections/logic/helpers'
import {
    createFolder,
    createHttpRequest,
    createWebSocketRequest,
    duplicateRequest,
    openTab,
    useUi,
    useWorkspace,
} from '@/stores'
import { downloadText, exportCollection } from '@/utils'
import type { Item } from '#shared/types.ts'

export function useItemMenuItems(item: Item) {
    const items = useWorkspace((state) => state.items)

    function addRequest() {
        addChild(item, createHttpRequest)
    }

    function addSocket() {
        addChild(item, createWebSocketRequest)
    }

    function addFolder() {
        addChild(item, createFolder)
    }

    function exportFile() {
        downloadText(`${item.name}.collection.json`, exportCollection(items, item.id))
    }

    function duplicate() {
        if (!isRequest(item)) {
            return
        }

        const copy = duplicateRequest(item as Parameters<typeof duplicateRequest>[0])

        openTab(
            {
                kind: 'item',
                id: copy.id,
            },
            { preview: !useUi.getState().activeTab },
        )
    }

    function remove() {
        void confirmDelete(item)
    }

    return {
        isContainer: isContainer(item),
        isCollection: item.kind === 'collection',
        isRequest: isRequest(item),
        addRequest,
        addSocket,
        addFolder,
        exportFile,
        duplicate,
        remove,
    }
}
