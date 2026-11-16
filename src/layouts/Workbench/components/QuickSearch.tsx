import { ItemGlyph, SearchInput } from '@/components'
import { useQuickSearch } from '@/layouts/Workbench/hooks/useQuickSearch'

export function QuickSearch() {
    const search = useQuickSearch()

    return (
        <div className="quick-search">
            <SearchInput
                ref={search.inputRef}
                className="quick-search-input"
                role="combobox"
                aria-label="Search requests"
                aria-expanded={search.showResults}
                aria-controls={search.listId}
                aria-activedescendant={search.activeId}
                placeholder="Search"
                value={search.query}
                trailing={<kbd className="quick-search-key">⌘K</kbd>}
                onChange={search.changeQuery}
                onFocus={search.open}
                onBlur={search.close}
                onKeyDown={search.handleKeyDown}
            />

            {search.showResults && (
                <ul
                    id={search.listId}
                    className="quick-search-results"
                    role="listbox"
                >
                    {search.isEmpty && (
                        <li className="quick-search-empty">
                            No collections, folders or requests match.
                        </li>
                    )}

                    {search.rows.map((row, index) => (
                        <li
                            key={row.id}
                            id={row.domId}
                            role="option"
                            aria-selected={row.isSelected}
                            onMouseDown={(event) => search.pick(event, row.item)}
                            onMouseEnter={() => search.hover(index)}
                        >
                            <ItemGlyph item={row.item} />
                            <span className="truncate">{row.item.name}</span>
                            <span className="muted truncate">{row.path}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
