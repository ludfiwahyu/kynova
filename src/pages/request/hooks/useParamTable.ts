import type { ParamTableProps } from '@/pages/request/types'
import type { AuthParam } from '#shared/types.ts'

export function useParamTable({ rows, onChange, disabled }: ParamTableProps) {
    // A blank last row adds a parameter.
    const all = disabled
        ? rows
        : [
              ...rows,
              {
                  key: '',
                  value: '',
              },
          ]

    function update(index: number, changes: Partial<AuthParam>) {
        const next = all
            .map((row, at) =>
                at === index
                    ? {
                          ...row,
                          ...changes,
                      }
                    : row,
            )
            .filter((row, at) => at < rows.length || row.key || row.value)

        onChange(next.filter((row) => row.key || row.value || row.send_as))
    }

    function remove(index: number) {
        onChange(rows.filter((_, at) => at !== index))
    }

    function isExisting(index: number) {
        return index < rows.length
    }

    return {
        all,
        update,
        remove,
        isExisting,
    }
}
