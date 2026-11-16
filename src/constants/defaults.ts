import { newId } from '@/utils'
import type { HttpRequest, KeyValue } from '#shared/types.ts'

export function newKeyValue(key = '', value = '', enabled = true): KeyValue {
    return {
        id: newId(),
        key,
        value,
        enabled,
    }
}

export function newHttpRequest(): HttpRequest {
    return {
        method: 'GET',
        url: '',
        params: [],
        headers: [],
        auth: { type: 'none' },
        body: { type: 'none' },
    }
}
