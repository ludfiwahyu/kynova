import { classNames } from '@/components/utils/helpers'

/** The smallest change that turns `from` into `to`, so outside edits keep the cursor in place. */
export function difference(
    from: string,
    to: string,
): {
    from: number
    to: number
    insert: string
} {
    let start = 0

    while (start < from.length && start < to.length && from[start] === to[start]) {
        start++
    }

    let end = 0

    while (
        end < from.length - start &&
        end < to.length - start &&
        from[from.length - 1 - end] === to[to.length - 1 - end]
    ) {
        end++
    }

    return {
        from: start,
        to: from.length - end,
        insert: to.slice(start, to.length - end),
    }
}

export function codeAreaClass(fill: boolean): string {
    return classNames('code-area font-mono', fill && 'code-area-fill')
}
