import { Search, X } from 'lucide-react'

import { useSearchInput } from '@/components/ui/SearchInput/hooks/useSearchInput'
import type { SearchInputProps } from '@/components/ui/SearchInput/types'
import { classNames } from '@/components/utils/helpers'

export function SearchInput({
    value,
    onChange,
    onKeyDown,
    trailing,
    className,
    ref,
    ...props
}: SearchInputProps) {
    const search = useSearchInput({
        value,
        onChange,
        onKeyDown,
    })

    return (
        <div className={classNames('input-group', className)}>
            <Search
                size={14}
                className="input-group-icon"
                aria-hidden="true"
            />

            <input
                ref={ref}
                {...props}
                className="input-group-field"
                value={value}
                onChange={search.handleChange}
                onKeyDown={search.handleKeyDown}
            />

            {value ? (
                <button
                    type="button"
                    className="input-group-clear"
                    aria-label="Clear"
                    onMouseDown={search.keepFocus}
                    onClick={search.clear}
                >
                    <X size={13} />
                </button>
            ) : (
                trailing
            )}
        </div>
    )
}
