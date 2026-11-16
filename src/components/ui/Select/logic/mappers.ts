import type { OptionView, SelectOption } from '@/components/ui/Select/types'

export function toOptionViews<T extends string>(
    options: SelectOption<T>[],
    value: T,
): OptionView<T>[] {
    return options.map((option) => ({
        option,
        className: `menu-item select-option ${option.className ?? ''}`,
        isSelected: option.value === value,
        lineKey: `${option.value}-line`,
    }))
}
