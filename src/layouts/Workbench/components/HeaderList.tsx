import type { HeaderListProps } from '@/layouts/Workbench/types'

export function HeaderList({ headers }: HeaderListProps) {
    return (
        <div className="contents">
            {headers.length === 0 && <p className="muted">None</p>}

            {headers.length > 0 && (
                <table className="header-list code">
                    <tbody>
                        {headers.map(([name, value], index) => (
                            <tr key={index}>
                                <th scope="row">{name}</th>
                                <td>{value}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    )
}
